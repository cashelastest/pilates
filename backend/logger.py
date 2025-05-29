import logging
import sys
from typing import Dict

class ColoredFormatter(logging.Formatter):
    """Custom formatter for colored log output with function names and line numbers"""
    
    # ANSI color codes
    COLORS: Dict[str, str] = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green  
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
        'RESET': '\033[0m'      # Reset
    }
    
    def format(self, record: logging.LogRecord) -> str:
        # Get color for logging level
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        reset = self.COLORS['RESET']
        
        # Format message with color
        record.levelname = f"{color}{record.levelname}{reset}"
        
        return super().format(record)

def setup_logger(name: str = __name__, level: int = logging.DEBUG, include_func: bool = True) -> logging.Logger:
    """
    Creates and configures a colored logger
    
    Args:
        name: logger name
        level: minimum logging level
        include_func: whether to include function name and line number
        
    Returns:
        Configured logger
    """
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Avoid duplicating handlers
    if logger.handlers:
        return logger
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Choose format based on include_func parameter
    if include_func:
        fmt = '%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s'
    else:
        fmt = '%(asctime)s | %(levelname)s | %(name)s | %(message)s'
    
    # Create colored formatter with function name
    formatter = ColoredFormatter(
        fmt=fmt,
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

# Additional formatting options
def setup_detailed_logger(name: str = __name__) -> logging.Logger:
    """Logger with detailed information including file path"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = ColoredFormatter(
            fmt='%(asctime)s | %(levelname)s | %(name)s | %(pathname)s:%(funcName)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

def setup_simple_logger(name: str = __name__) -> logging.Logger:
    """Simple logger with minimal information"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = ColoredFormatter(
            fmt='%(levelname)s | %(funcName)s | %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

# Alternative version using colorama (install with: pip install colorama)
def setup_colorama_logger(name: str = __name__) -> logging.Logger:
    """Logger using colorama library"""
    try:
        from colorama import Fore, Back, Style, init
        init(autoreset=True)  # Automatic color reset
        
        class ColoramaFormatter(logging.Formatter):
            LEVEL_COLORS = {
                'DEBUG': Fore.CYAN,
                'INFO': Fore.GREEN,
                'WARNING': Fore.YELLOW,
                'ERROR': Fore.RED,
                'CRITICAL': Fore.MAGENTA + Style.BRIGHT
            }
            
            def format(self, record):
                color = self.LEVEL_COLORS.get(record.levelname, '')
                record.levelname = f"{color}{record.levelname}"
                return super().format(record)
        
        logger = logging.getLogger(name)
        logger.setLevel(logging.DEBUG)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = ColoramaFormatter(
                '%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
                '%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
        
    except ImportError:
        print("Colorama is not installed. Use: pip install colorama")
        return setup_logger(name)
loggers = {
        "coaches": setup_colorama_logger("coaches"),
        "client":setup_colorama_logger("client"),
        "group":setup_colorama_logger('group'),
        'dashboard': setup_colorama_logger('dashboard'),
        'utils':setup_colorama_logger("utils"),
        "statistics":setup_colorama_logger("statistics")
    }
# Usage example
if __name__ == "__main__":
    # Create logger
    logger = setup_logger("MyApp")
    
    def test_function():
        """Example function to demonstrate function name logging"""
        logger.debug("This is a debug message from test_function")
        logger.info("This is an info message from test_function")
        
    def another_function():
        """Another example function"""
        logger.warning("Warning from another_function")
        logger.error("Error from another_function")
    
    # Test all levels from main
    logger.debug("This is a debug message")
    logger.info("This is an info message") 
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    logger.critical("This is a critical message")
    
    # Test from functions
    test_function()
    another_function()
    
    print("\n" + "="*50 + "\n")
    
    # Example with colorama (if installed)
    colorama_logger = setup_colorama_logger("ColoramaApp")
    
    def colorama_test():
        colorama_logger.debug("Debug with colorama from function")
        colorama_logger.info("Info with colorama from function")
    
    colorama_test()
    colorama_logger.warning("Warning with colorama") 
    colorama_logger.error("Error with colorama")
    
    # Example of logging in different modules
    api_logger = setup_logger("API")
    db_logger = setup_logger("Database")
    
    def api_handler():
        api_logger.info("API request processed")
        
    def db_connect():
        db_logger.error("Database connection error")
    
    api_handler()
    db_connect()
    
    print("\n" + "="*30 + " DIFFERENT FORMATS " + "="*30 + "\n")
    
    # Test different logger formats
    detailed_logger = setup_detailed_logger("DetailedApp")
    simple_logger = setup_simple_logger("SimpleApp")
    no_func_logger = setup_logger("NoFuncApp", include_func=False)
    
    def format_test():
        detailed_logger.info("Detailed logger with full path")
        simple_logger.info("Simple logger with minimal info")
        no_func_logger.info("Logger without function info")
    
    format_test()