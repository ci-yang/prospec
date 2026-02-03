/**
 * Prospec Error hierarchy
 *
 * All custom errors extend ProspecError and carry:
 * - message: user-readable error description
 * - code: machine-readable error code (UPPER_SNAKE_CASE)
 * - suggestion: actionable fix recommendation
 */

export class ProspecError extends Error {
  readonly code: string;
  readonly suggestion: string;

  constructor(message: string, code: string, suggestion: string) {
    super(message);
    this.name = 'ProspecError';
    this.code = code;
    this.suggestion = suggestion;
  }
}

// --- Config errors ---

export class ConfigNotFound extends ProspecError {
  constructor(path?: string) {
    super(
      path
        ? `找不到配置檔：${path}`
        : '找不到 .prospec.yaml 配置檔',
      'CONFIG_NOT_FOUND',
      '請先執行 `prospec init` 初始化專案',
    );
    this.name = 'ConfigNotFound';
  }
}

export class ConfigInvalid extends ProspecError {
  constructor(details: string) {
    super(
      `配置檔驗證失敗：${details}`,
      'CONFIG_INVALID',
      '請檢查 .prospec.yaml 的格式是否正確',
    );
    this.name = 'ConfigInvalid';
  }
}

// --- File system errors ---

export class ScanError extends ProspecError {
  constructor(path: string, cause?: string) {
    super(
      `掃描失敗：${path}${cause ? ` (${cause})` : ''}`,
      'SCAN_ERROR',
      '請確認目錄路徑正確且有讀取權限',
    );
    this.name = 'ScanError';
  }
}

export class WriteError extends ProspecError {
  constructor(path: string, cause?: string) {
    super(
      `寫入失敗：${path}${cause ? ` (${cause})` : ''}`,
      'WRITE_ERROR',
      '請確認目標路徑有寫入權限',
    );
    this.name = 'WriteError';
  }
}

export class PermissionError extends WriteError {
  constructor(path: string) {
    super(path, '權限不足');
    this.name = 'PermissionError';
  }
}

// --- Parse errors ---

export class YamlParseError extends ProspecError {
  constructor(path: string, cause?: string) {
    super(
      `YAML 解析失敗：${path}${cause ? ` (${cause})` : ''}`,
      'YAML_PARSE_ERROR',
      '請檢查 YAML 檔案的語法是否正確',
    );
    this.name = 'YamlParseError';
  }
}

// --- Template errors ---

export class TemplateError extends ProspecError {
  constructor(templateName: string, cause?: string) {
    super(
      `模板處理失敗：${templateName}${cause ? ` (${cause})` : ''}`,
      'TEMPLATE_ERROR',
      '請確認模板檔案存在且格式正確',
    );
    this.name = 'TemplateError';
  }
}

// --- Detection errors ---

export class ModuleDetectionError extends ProspecError {
  constructor(cause?: string) {
    super(
      `模組偵測失敗${cause ? `：${cause}` : ''}`,
      'MODULE_DETECTION_ERROR',
      '請確認專案結構符合預期，或手動建立 module-map.yaml',
    );
    this.name = 'ModuleDetectionError';
  }
}

// --- State errors ---

export class AlreadyExistsError extends ProspecError {
  constructor(target: string) {
    super(
      `${target} 已存在`,
      'ALREADY_EXISTS',
      '如需重新初始化，請先刪除現有檔案',
    );
    this.name = 'AlreadyExistsError';
  }
}

export class PrerequisiteError extends ProspecError {
  constructor(missing: string, suggestion?: string) {
    super(
      `前置條件未滿足：${missing}`,
      'PREREQUISITE_ERROR',
      suggestion ?? '請先完成必要的前置步驟',
    );
    this.name = 'PrerequisiteError';
  }
}
