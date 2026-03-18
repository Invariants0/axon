import { systemApi } from "@/lib/api-client";

export class SystemService {
  static getHealth() {
    return systemApi.health();
  }

  static getStatus() {
    return systemApi.status();
  }

  static getMetrics() {
    return systemApi.metrics();
  }
}
