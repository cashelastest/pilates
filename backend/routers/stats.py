from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from connection import Connection
from models import Client, Coach, Lesson, Subscription, Group, SubscriptionTemplate
from datetime import datetime, timedelta
from sqlalchemy import func, and_, extract
import json
from logger import loggers
logger = loggers['statistics']

templates = Jinja2Templates(directory='templates')
stats_router = APIRouter(prefix="/statistics")

@stats_router.get("/")
def get_statistics(request: Request):
    return templates.TemplateResponse(
        request=request, name="stats.html"
    )

# ====================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======================

def parse_period(period_data):
    """Парсинг периода времени"""
    period_type = period_data.get('type', 'month')
    today = datetime.now().date()
    
    if period_type == 'week':
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif period_type == 'month':
        start_date = today.replace(day=1)
        # Исправлен расчет конца месяца
        if today.month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    elif period_type == 'quarter':
        quarter = (today.month - 1) // 3 + 1
        start_date = today.replace(month=(quarter - 1) * 3 + 1, day=1)
        # Исправлен расчет конца квартала
        end_month = quarter * 3
        if end_month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=end_month + 1, day=1) - timedelta(days=1)
    elif period_type == 'year':
        start_date = today.replace(month=1, day=1)
        end_date = today.replace(month=12, day=31)
    elif period_type == 'custom':
        start_date = datetime.strptime(period_data['startDate'], '%Y-%m-%d').date()
        end_date = datetime.strptime(period_data['endDate'], '%Y-%m-%d').date()
    else:
        # По умолчанию - текущий месяц
        start_date = today.replace(day=1)
        if today.month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    
    return start_date, end_date

def calculate_percentage_change(current, previous):
    """Вычисление процентного изменения"""
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100, 1)

# ====================== ОСНОВНЫЕ ФУНКЦИИ СТАТИСТИКИ ======================

async def get_overview_stats(ws, period):
    """Общая статистика"""
    try:
        start_date, end_date = parse_period(period)
        
        with Connection.session_scope() as session:
            # Активные клиенты (status = True)
            active_clients = session.query(Client).filter(Client.status == True).count()
            
            # Занятия за период (неотмененные)
            monthly_lessons = session.query(Lesson).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date,
                    Lesson.is_cancelled == False
                )
            ).count()
            
            # Средняя посещаемость (процент неотмененных занятий)
            total_lessons_scheduled = session.query(Lesson).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date
                )
            ).count()
            
            avg_attendance = 0
            if total_lessons_scheduled > 0:
                avg_attendance = round((monthly_lessons / total_lessons_scheduled) * 100, 1)
            
            # Доход за период (из проведенных занятий)
            monthly_revenue_result = session.query(func.sum(Lesson.price)).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date,
                    Lesson.is_cancelled == False
                )
            ).scalar()
            monthly_revenue = monthly_revenue_result or 0
            
            # Вычисляем изменения по сравнению с предыдущим периодом
            period_length = end_date - start_date + timedelta(days=1)
            prev_start = start_date - period_length
            prev_end = start_date - timedelta(days=1)
            
            prev_lessons = session.query(Lesson).filter(
                and_(
                    Lesson.date >= prev_start,
                    Lesson.date <= prev_end,
                    Lesson.is_cancelled == False
                )
            ).count()
            
            prev_revenue_result = session.query(func.sum(Lesson.price)).filter(
                and_(
                    Lesson.date >= prev_start,
                    Lesson.date <= prev_end,
                    Lesson.is_cancelled == False
                )
            ).scalar()
            prev_revenue = prev_revenue_result or 0
            
            # Вычисляем процентные изменения
            monthly_lessons_change = calculate_percentage_change(monthly_lessons, prev_lessons)
            monthly_revenue_change = calculate_percentage_change(monthly_revenue, prev_revenue)
            
            await ws.send_json({
                'code': 600,  # OVERVIEW_STATS
                'data': {
                    'activeClients': active_clients,
                    'activeClientsChange': 0,  # Сложно вычислить без даты активации
                    'monthlyLessons': monthly_lessons,
                    'monthlyLessonsChange': monthly_lessons_change,
                    'avgAttendance': avg_attendance,
                    'avgAttendanceChange': 0,
                    'monthlyRevenue': float(monthly_revenue),
                    'monthlyRevenueChange': monthly_revenue_change
                }
            })
            
    except Exception as e:
        await ws.send_json({
            'code': 400,  # ERROR
            'message': f'Ошибка получения общей статистики: {str(e)}'
        })

async def get_attendance_stats(ws, period):
    """Статистика посещаемости"""
    try:
        start_date, end_date = parse_period(period)
        
        with Connection.session_scope() as session:
            # Получаем все уникальные даты в периоде
            all_dates = session.query(Lesson.date).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date,
                    Lesson.is_cancelled == False
                )
            ).distinct().order_by(Lesson.date).all()
            
            # Считаем групповые занятия по дням
            group_lessons_by_date = {}
            for date_row in all_dates:
                date = date_row[0]
                count = session.query(Lesson).filter(
                    and_(
                        Lesson.date == date,
                        Lesson.is_cancelled == False,
                        Lesson.group_id.isnot(None)
                    )
                ).count()
                group_lessons_by_date[date] = count
            
            # Считаем индивидуальные занятия по дням
            individual_lessons_by_date = {}
            for date_row in all_dates:
                date = date_row[0]
                count = session.query(Lesson).filter(
                    and_(
                        Lesson.date == date,
                        Lesson.is_cancelled == False,
                        Lesson.group_id.is_(None)
                    )
                ).count()
                individual_lessons_by_date[date] = count
            
            # Создаем равномерные интервалы дат
            days_diff = (end_date - start_date).days
            if days_diff <= 7:
                interval = 1
            elif days_diff <= 31:
                interval = 5
            else:
                interval = 10
            
            labels = []
            group_lessons = []
            individual_lessons = []
            
            current_date = start_date
            while current_date <= end_date:
                labels.append(current_date.strftime('%d %b'))
                
                interval_end = min(current_date + timedelta(days=interval - 1), end_date)
                
                group_count = 0
                individual_count = 0
                
                # Суммируем за интервал
                check_date = current_date
                while check_date <= interval_end:
                    group_count += group_lessons_by_date.get(check_date, 0)
                    individual_count += individual_lessons_by_date.get(check_date, 0)
                    check_date += timedelta(days=1)
                
                group_lessons.append(group_count)
                individual_lessons.append(individual_count)
                
                current_date += timedelta(days=interval)
            
            await ws.send_json({
                'code': 601,  # ATTENDANCE_STATS
                'data': {
                    'labels': labels,
                    'groupLessons': group_lessons,
                    'individualLessons': individual_lessons
                }
            })
            
    except Exception as e:
        await ws.send_json({
            'code': 400,  # ERROR
            'message': f'Ошибка получения статистики посещаемости: {str(e)}'
        })

async def get_revenue_stats(ws, period):
    """Статистика доходов"""
    try:
        start_date, end_date = parse_period(period)
        
        with Connection.session_scope() as session:
            # Доходы от групповых занятий
            group_revenue_result = session.query(func.sum(Lesson.price)).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date,
                    Lesson.is_cancelled == False,
                    Lesson.group_id.isnot(None)
                )
            ).scalar()
            group_revenue = group_revenue_result or 0
            logger.info(f'Group lessons for дохід за категоріями: {group_revenue}')

            # Доходы от индивидуальных занятий
            individual_revenue_result = session.query(func.sum(Lesson.price)).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date,
                    Lesson.is_cancelled == False,
                    Lesson.group_id.is_(None)
                )
            ).scalar()
            individual_revenue = individual_revenue_result or 0
            logger.info(f'Individual lessons for дохід за категоріями: {individual_revenue}')

            subscription_revenue_result = session.query(
                func.sum(SubscriptionTemplate.price)
            ).join(
                Subscription, SubscriptionTemplate.id == Subscription.template_id
            ).filter(
                and_(
                    Subscription.valid_until >= start_date,
                    Subscription.valid_until <= end_date
                )
            ).scalar()
            subscription_revenue = subscription_revenue_result or 0
            
            await ws.send_json({
                'code': 602,  # REVENUE_STATS
                'data': {
                    'labels': ['Групові заняття', 'Індивідуальні заняття', 'Абонементи'],
                    'values': [
                        float(group_revenue),
                        float(individual_revenue),
                        float(subscription_revenue)
                    ]
                }
            })
            
    except Exception as e:
        await ws.send_json({
            'code': 400,  # ERROR
            'message': f'Ошибка получения статистики доходов: {str(e)}'
        })

async def get_trainers_stats(ws, period):
    """Статистика по тренерам"""
    try:
        start_date, end_date = parse_period(period)
        
        with Connection.session_scope() as session:
            # Получаем базовую статистику по тренерам
            trainers_stats = session.query(
                Coach.id,
                Coach.name,
                func.count(Lesson.id).label('lessons_count'),
                func.count(func.distinct(Lesson.client_id)).label('clients_count'),
                func.sum(Lesson.price).label('revenue')
            ).join(
                Lesson, Coach.id == Lesson.coach_id
            ).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date
                )
            ).group_by(Coach.id, Coach.name).all()
            
            trainers_data = []
            for stats in trainers_stats:
                # Считаем посещаемость отдельно для каждого тренера
                total_lessons = session.query(func.count(Lesson.id)).filter(
                    and_(
                        Lesson.coach_id == stats.id,
                        Lesson.date >= start_date,
                        Lesson.date <= end_date
                    )
                ).scalar() or 0
                
                completed_lessons = session.query(func.count(Lesson.id)).filter(
                    and_(
                        Lesson.coach_id == stats.id,
                        Lesson.date >= start_date,
                        Lesson.date <= end_date,
                        Lesson.is_cancelled == False
                    )
                ).scalar() or 0
                
                attendance_rate = 0
                if total_lessons > 0:
                    attendance_rate = round((completed_lessons / total_lessons) * 100, 1)
                
                trainers_data.append({
                    'id': stats.id,
                    'name': stats.name,
                    'lessonsCount': stats.lessons_count or 0,
                    'clientsCount': stats.clients_count or 0,
                    'attendanceRate': attendance_rate,
                    'revenue': float(stats.revenue or 0)
                })
            
            # Сортируем по доходам
            trainers_data.sort(key=lambda x: x['revenue'], reverse=True)
            
            await ws.send_json({
                'code': 603,  # TRAINERS_STATS
                'data': {
                    'trainers': trainers_data
                }
            })
            
    except Exception as e:
        await ws.send_json({
            'code': 400,  # ERROR
            'message': f'Ошибка otrzymания статистики тренеров: {str(e)}'
        })

async def get_popular_classes(ws, period):
    """Статистика популярных занятий"""
    try:
        start_date, end_date = parse_period(period)
        
        with Connection.session_scope() as session:
            # Подсчитываем популярность по группам
            popular_groups = session.query(
                Group.name,
                func.count(Lesson.id).label('lessons_count')
            ).join(
                Lesson, Group.id == Lesson.group_id
            ).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date,
                    Lesson.is_cancelled == False
                )
            ).group_by(Group.name).order_by(
                func.count(Lesson.id).desc()
            ).limit(10).all()
            
            # Добавляем индивидуальные занятия
            individual_count = session.query(func.count(Lesson.id)).filter(
                and_(
                    Lesson.date >= start_date,
                    Lesson.date <= end_date,
                    Lesson.is_cancelled == False,
                    Lesson.group_id.is_(None)
                )
            ).scalar() or 0
            
            labels = [group.name for group in popular_groups]
            values = [group.lessons_count for group in popular_groups]
            
            if individual_count > 0:
                labels.append('Індивідуальні заняття')
                values.append(individual_count)
            
            await ws.send_json({
                'code': 604,  # POPULAR_CLASSES
                'data': {
                    'labels': labels,
                    'values': values
                }
            })
            
    except Exception as e:
        await ws.send_json({
            'code': 400,  # ERROR
            'message': f'Ошибка получения статистики популярных занятий: {str(e)}'
        })

async def get_new_clients_stats(ws, period):
    """Статистика новых клиентов"""
    try:
        # Группируем новых клиентов по месяцам за последние 6 месяцев
        six_months_ago = datetime.now().date().replace(day=1) - timedelta(days=180)
        
        with Connection.session_scope() as session:
            new_clients_by_month = session.query(
                extract('month', Client.joined).label('month'),
                extract('year', Client.joined).label('year'),
                func.count(Client.id).label('clients_count')
            ).filter(
                and_(
                    Client.joined >= six_months_ago,
                    Client.joined.isnot(None)
                )
            ).group_by(
                extract('year', Client.joined),
                extract('month', Client.joined)
            ).order_by(
                extract('year', Client.joined),
                extract('month', Client.joined)
            ).all()
            
            # Формируем данные для графика
            labels = []
            values = []
            
            month_names = [
                'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
            ]
            
            for stat in new_clients_by_month:
                month_name = month_names[int(stat.month) - 1]
                year = int(stat.year)
                labels.append(f'{month_name} {year}')
                values.append(stat.clients_count)
            
            await ws.send_json({
                'code': 605,  # NEW_CLIENTS_STATS
                'data': {
                    'labels': labels,
                    'values': values
                }
            })
            
    except Exception as e:
        await ws.send_json({
            'code': 400,  # ERROR
            'message': f'Ошибка получения статистики новых клиентов: {str(e)}'
        })