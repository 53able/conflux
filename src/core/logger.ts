import winston from 'winston';

/**
 * 色付きログ用のカラー定義
 * chalkの代替としてwinstonの色指定を活用
 */
export const LogColors = {
  // 基本色
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // 太字
  bold: '\x1b[1m',
  
  // リセット
  reset: '\x1b[0m',
  
  // 組み合わせ色
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
} as const;

/**
 * 色付きテキストを生成するヘルパー関数
 */
export const colorize = (text: string, color: keyof typeof LogColors): string => {
  return `${LogColors[color]}${text}${LogColors.reset}`;
};

/**
 * 複数の色を組み合わせる関数
 */
export const colorizeMultiple = (text: string, ...colors: (keyof typeof LogColors)[]): string => {
  const colorCodes = colors.map(color => LogColors[color]).join('');
  return `${colorCodes}${text}${LogColors.reset}`;
};

/**
 * ロガー状態の型定義
 */
type LoggerState = {
  instance: winston.Logger | null;
  isInitialized: boolean;
};

/**
 * ロガー状態の管理
 */
let loggerState: LoggerState = {
  instance: null,
  isInitialized: false
};

/**
 * ロガーを初期化する関数
 * 環境変数に基づいてログレベルと出力先を設定
 */
const initializeLogger = (): winston.Logger => {
  if (loggerState.isInitialized && loggerState.instance) {
    return loggerState.instance;
  }

  const logLevel = process.env.LOG_LEVEL || 'info';
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';

  // ログフォーマット設定
  const logFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
  );

  // コンソール用フォーマット（開発環境では見やすく）
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'HH:mm:ss.SSS'
    }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
  );

  // トランスポート設定
  const transports: winston.transport[] = [];

  // コンソール出力
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: isDevelopment ? consoleFormat : logFormat,
      silent: process.env.NODE_ENV === 'test'
    })
  );

  // ファイル出力（本番環境またはログファイルが指定されている場合）
  if (process.env.LOG_FILE || nodeEnv === 'production') {
    const logFile = process.env.LOG_FILE || 'conflux.log';
    transports.push(
      new winston.transports.File({
        filename: logFile,
        level: logLevel,
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      })
    );
  }

  // エラーログ専用ファイル
  if (process.env.ERROR_LOG_FILE || nodeEnv === 'production') {
    const errorLogFile = process.env.ERROR_LOG_FILE || 'conflux-error.log';
    transports.push(
      new winston.transports.File({
        filename: errorLogFile,
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      })
    );
  }

  // ロガーインスタンス作成
  const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exitOnError: false,
    silent: process.env.NODE_ENV === 'test'
  });

  // 未キャッチ例外と未処理のPromise拒否をログに記録
  logger.exceptions.handle(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );

  logger.rejections.handle(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );

  loggerState = {
    instance: logger,
    isInitialized: true
  };

  return logger;
};

/**
 * ロガーインスタンスを取得する関数
 */
export const getLogger = (): winston.Logger => {
  if (!loggerState.instance) {
    return initializeLogger();
  }
  return loggerState.instance;
};

/**
 * ログレベルを動的に変更する関数
 */
export const setLogLevel = (level: string): void => {
  const logger = getLogger();
  logger.level = level;
};

/**
 * ロガーをリセットする関数（テスト用）
 */
export const resetLogger = (): void => {
  if (loggerState.instance) {
    loggerState.instance.close();
    loggerState = {
      instance: null,
      isInitialized: false
    };
  }
};

/**
 * 色付きログ関数（chalkの代替）
 */
export const infoColored = (message: string, color: keyof typeof LogColors = 'white'): void => {
  const logger = getLogger();
  logger.info(colorize(message, color));
};

export const warnColored = (message: string, color: keyof typeof LogColors = 'yellow'): void => {
  const logger = getLogger();
  logger.warn(colorize(message, color));
};

export const errorColored = (message: string, color: keyof typeof LogColors = 'red'): void => {
  const logger = getLogger();
  logger.error(colorize(message, color));
};

export const debugColored = (message: string, color: keyof typeof LogColors = 'gray'): void => {
  const logger = getLogger();
  logger.debug(colorize(message, color));
};

/**
 * 複数色組み合わせログ関数
 */
export const infoMultiColored = (message: string, ...colors: (keyof typeof LogColors)[]): void => {
  const logger = getLogger();
  logger.info(colorizeMultiple(message, ...colors));
};

export const warnMultiColored = (message: string, ...colors: (keyof typeof LogColors)[]): void => {
  const logger = getLogger();
  logger.warn(colorizeMultiple(message, ...colors));
};

export const errorMultiColored = (message: string, ...colors: (keyof typeof LogColors)[]): void => {
  const logger = getLogger();
  logger.error(colorizeMultiple(message, ...colors));
};


// デフォルトエクスポート
export default getLogger();
