export interface ApiCallLog {
  id: string;
  timestamp: string;
  service: 'bsale' | 'amazon';
  method: string;
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  statusCode?: number;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  durationMs: number;
}

class ApiLogger {
  private logs: ApiCallLog[] = [];
  private maxLogs = 500;

  log(call: Omit<ApiCallLog, 'id' | 'timestamp'>): ApiCallLog {
    const entry: ApiCallLog = {
      id: `api-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...call,
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    return entry;
  }

  getLogs(limit: number = 100, filter?: { service?: string; status?: string }): ApiCallLog[] {
    let result = [...this.logs].reverse();
    if (filter?.service) {
      result = result.filter(l => l.service === filter.service);
    }
    if (filter?.status) {
      result = result.filter(l => l.status === filter.status);
    }
    return result.slice(0, limit);
  }

  getStats(): { total: number; success: number; error: number; pending: number } {
    return {
      total: this.logs.length,
      success: this.logs.filter(l => l.status === 'success').length,
      error: this.logs.filter(l => l.status === 'error').length,
      pending: this.logs.filter(l => l.status === 'pending').length,
    };
  }

  clear(): void {
    this.logs = [];
  }
}

export const apiLogger = new ApiLogger();
