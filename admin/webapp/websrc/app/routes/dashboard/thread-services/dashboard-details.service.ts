import { Injectable } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';

@Injectable()
export class DashboardDetailsService {

  private worker;
  isAutoScanOn: boolean = false;
  highPriorityVulnerabilities: any;
  containers: any;
  services: any;
  applications: any;

  constructor() {}

  runWorker() {
    if (this.worker) this.worker.terminate();
    this.createWorker();
  }

  createWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./dashboard-details.worker.ts', import.meta.url)
      );
    }
    if (this.worker) {
      this.isAutoScanOn = false;
      this.highPriorityVulnerabilities = null;
      this.containers = null;
      this.services = null;
      this.applications = null;
      this.worker.postMessage(
        JSON.stringify({
          token: GlobalVariable.user?.token.token,
          currUrl: window.location.href,
          isSUSESSO: GlobalVariable.isSUSESSO ? GlobalVariable.isSUSESSO : "",
          neuvectorProxy: GlobalConstant.PROXY_VALUE
        })
      );
      this.worker.onmessage = (message) => {
        this.isAutoScanOn = message.data.autoScanConfig;
        this.highPriorityVulnerabilities = message.data.highPriorityVulnerabilities;
        this.containers = message.data.containers;
        this.services = message.data.services;
        this.applications = message.data.applications2;
      };
    }
  }

  terminateWorker() {
    this.worker?.terminate();
  }
}
