import winston from 'winston';

/**
 * 共通のWinstonロガー設定
 * Confluxプロジェクト全体で統一された構造化ログを提供
 */
export class Logger {
  private static instance: winston.Logger;
  private static isInitialized = false;

  /**
   * ロガーインスタンスを取得
   * シングルトンパターンで統一されたログ設定を提供
   */
  public static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.initialize();
    }
    return Logger.instance;
  }

  /**
   * ロガーを初期化
   * 環境変数に基づいてログレベルと出力先を設定
   */
  private static initialize(): void {
    if (Logger.isInitialized) {
      return;
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
    Logger.instance = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false,
      silent: process.env.NODE_ENV === 'test'
    });

    // 未キャッチ例外と未処理のPromise拒否をログに記録
    Logger.instance.exceptions.handle(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );

    Logger.instance.rejections.handle(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );

    Logger.isInitialized = true;
  }

  /**
   * ログレベルを動的に変更
   */
  public static setLevel(level: string): void {
    const logger = Logger.getInstance();
    logger.level = level;
  }

  /**
   * ロガーをリセット（テスト用）
   */
  public static reset(): void {
    if (Logger.instance) {
      Logger.instance.close();
      Logger.instance = null as any;
      Logger.isInitialized = false;
    }
  }
}

// デフォルトエクスポート
export default Logger.getInstance();
