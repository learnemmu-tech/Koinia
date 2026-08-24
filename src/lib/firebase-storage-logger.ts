type StorageLogContext = Record<string, unknown>;

const PREFIX = "[Firebase Storage]";

function formatContext(context?: StorageLogContext): string {
  if (!context || Object.keys(context).length === 0) return "";
  return ` ${JSON.stringify(context)}`;
}

export const storageLog = {
  config(message: string, context?: StorageLogContext) {
    console.info(`${PREFIX} [config] ${message}${formatContext(context)}`);
  },

  uploadStart(message: string, context?: StorageLogContext) {
    console.info(`${PREFIX} [upload:start] ${message}${formatContext(context)}`);
  },

  uploadProgress(message: string, context?: StorageLogContext) {
    console.info(`${PREFIX} [upload:progress] ${message}${formatContext(context)}`);
  },

  uploadSuccess(message: string, context?: StorageLogContext) {
    console.info(`${PREFIX} [upload:success] ${message}${formatContext(context)}`);
  },

  downloadUrl(message: string, context?: StorageLogContext) {
    console.info(`${PREFIX} [downloadURL] ${message}${formatContext(context)}`);
  },

  warn(message: string, context?: StorageLogContext) {
    console.warn(`${PREFIX} [warn] ${message}${formatContext(context)}`);
  },

  error(message: string, error: unknown, context?: StorageLogContext) {
    const details =
      error instanceof Error ?
        { name: error.name, message: error.message, code: (error as { code?: string }).code }
      : { error: String(error) };

    console.error(
      `${PREFIX} [error] ${message}${formatContext({ ...context, ...details })}`
    );
  },
};
