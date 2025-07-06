import { logger, log, LogLevel, PerformanceMonitor, trackError } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clearLogs();
    logger.setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic logging', () => {
    it('should log debug messages', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      log.debug('Test debug message', 'TestContext');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔍 [TestContext]',
        'Test debug message'
      );
      
      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Test debug message');
      expect(logs[0].context).toBe('TestContext');
      
      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      log.info('Test info message');
      
      expect(consoleSpy).toHaveBeenCalledWith('ℹ️ ', 'Test info message');
      
      consoleSpy.mockRestore();
    });

    it('should log warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      log.warn('Test warning', 'TestContext', { extra: 'data' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ [TestContext]',
        'Test warning',
        { extra: 'data' }
      );
      
      consoleSpy.mockRestore();
    });

    it('should log errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      log.error('Test error message');
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ ', 'Test error message');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Log levels', () => {
    it('should respect log level filtering', () => {
      logger.setLogLevel(LogLevel.WARN);
      
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      log.debug('Debug message');
      log.info('Info message');
      log.warn('Warning message');
      
      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      
      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('Log management', () => {
    it('should limit log storage', () => {
      // Add more logs than the limit
      for (let i = 0; i < 1100; i++) {
        log.info(`Message ${i}`);
      }
      
      const logs = logger.getRecentLogs(1100);
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it('should clear logs', () => {
      log.info('Test message');
      expect(logger.getRecentLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getRecentLogs()).toHaveLength(0);
    });

    it('should export logs as string', () => {
      log.info('Test message', 'TestContext');
      
      const exported = logger.exportLogs();
      expect(exported).toContain('INFO');
      expect(exported).toContain('[TestContext]');
      expect(exported).toContain('Test message');
    });
  });
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should measure synchronous operations', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    
    const result = PerformanceMonitor.measure('test-operation', () => {
      return 'test-result';
    });
    
    expect(result).toBe('test-result');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Performance timer ended: test-operation took'),
      'Performance'
    );
    
    consoleSpy.mockRestore();
  });

  it('should measure asynchronous operations', async () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    
    const result = await PerformanceMonitor.measureAsync('async-test', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'async-result';
    });
    
    expect(result).toBe('async-result');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Performance timer ended: async-test took'),
      'Performance'
    );
    
    consoleSpy.mockRestore();
  });
});

describe('trackError', () => {
  it('should track errors with context', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const error = new Error('Test error');
    trackError(error, 'TestContext', { userId: '123' });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '❌ [TestContext]',
      'Test error',
      expect.objectContaining({
        stack: error.stack,
        name: 'Error',
        userId: '123'
      })
    );
    
    consoleSpy.mockRestore();
  });
});
