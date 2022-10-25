import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  ElementRef
} from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { NetworkRulesService } from '@common/services/network-rules.service';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { PathConstant } from '@common/constants/path.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { NetworkRule } from '@common/types';
import { GridOptions } from 'ag-grid-community';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { UpdateType } from '@common/types/network-rules/enum';
import { Subscription } from 'rxjs';
import { AddEditNetworkRuleModalComponent } from '@components/network-rules/partial/add-edit-network-rule-modal/add-edit-network-rule-modal.component';
import { MoveNetworkRulesModalComponent } from '@components/network-rules/partial/move-network-rules-modal/move-network-rules-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import { switchMap, filter } from 'rxjs/operators';
import { Router, NavigationStart } from '@angular/router';
import { GroupsService } from '@services/groups.service';
import { MultiClusterService } from "@services/multi-cluster.service";

const READONLY_RULE_MODIFIED = 46;
const UNPROMOTABLE_ENDPOINT_PATTERN = new RegExp(/^Host\:*|^Workload\:*/);

@Component({
  selector: 'app-network-rules',
  templateUrl: './network-rules.component.html',
  styleUrls: ['./network-rules.component.scss'],
})
export class NetworkRulesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isScoreImprovement: boolean = false;
  @Input() source!: string;
  @Input() groupName!: string;
  @Input() resizableHeight!: number;
  navSource = GlobalConstant.NAV_SOURCE;
  eof = false;
  networkRuleErr = false;
  networkRules: Array<NetworkRule> = [];
  countOfGroundRule: number = 0;
  isWriteNetworkRuleAuthorized!: boolean;
  networkRuleOptions: any;
  gridOptions!: GridOptions;
  gridHeight!: number;
  filteredCount: number = 0;
  selectedNetworkRules: Array<NetworkRule> = [];
  containsUnpromotableEndpoint: boolean = false;
  context = { componentParent: this };
  routeEventSubscription!: Subscription;
  isWriteRuleAuthorized: boolean;
  isPrinting: boolean = false;
  private w: any;
  private switchClusterSubscription;
  @ViewChild('networkRulePrintableReport') printableReportView: ElementRef;

  constructor(
    private networkRulesService: NetworkRulesService,
    private groupsService: GroupsService,
    private authUtilsService: AuthUtilsService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private datePipe: DatePipe,
    private utils: UtilsService,
    private multiClusterService: MultiClusterService,
    public router: Router
  ) {
    this.w = GlobalVariable.window;
  }

  ngOnInit(): void {
    this.bindRouteEventListener();
    this.gridHeight = this.w.innerHeight - (this.source === GlobalConstant.NAV_SOURCE.SELF ? 215 : 270);
    this.isWriteNetworkRuleAuthorized =
      this.authUtilsService.getDisplayFlag('write_network_rule') &&
      (this.source !== GlobalConstant.NAV_SOURCE.GROUP ? this.authUtilsService.getDisplayFlag('multi_cluster') : true);
    this.gridOptions = this.networkRulesService.configGrid(
      this.isWriteNetworkRuleAuthorized,
      this.source,
      this.isScoreImprovement
    );
    this.gridOptions.onSelectionChanged = () => {
      this.selectedNetworkRules = this.gridOptions.api!.getSelectedRows();
      this.containsUnpromotableEndpoint = this.selectedNetworkRules.some(
        rule => {
          return (
            UNPROMOTABLE_ENDPOINT_PATTERN.test(rule.from) ||
            UNPROMOTABLE_ENDPOINT_PATTERN.test(rule.to)
          );
        }
      );
    };
    if (!this.isScoreImprovement) {
      this.networkRulesService.getAutoCompleteData(this.source).subscribe(
        ([groupList, hostList, appList]) => {
          this.networkRuleOptions = {
            groupList,
            hostList,
            appList,
          };
        },
        error => {}
      );
    }
    this.refresh();

    //refresh the page when it switched to a remote cluster
    this.switchClusterSubscription = this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
      this.refresh();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
    if (
      changes.groupName &&
      changes.groupName.previousValue &&
      changes.groupName.previousValue !== changes.groupName.currentValue
    ) {
      this.refresh();
    }
  }

  ngOnDestroy(): void {
    this.unbindRouteEventListener();

    if(this.switchClusterSubscription){
      this.switchClusterSubscription.unsubscribe();
    }
  }

  refresh = () => {
    if (this.source === GlobalConstant.NAV_SOURCE.GROUP) {
      if (this.isScoreImprovement) this.getServiceRules();
      else this.getGroupPolicy();
    } else {
      this.getNetworkRules();
    }
  };

  updateGridData = (
    updatedNetworkRules: Array<NetworkRule>,
    targetIndex: number,
    updateType: UpdateType
  ) => {
    switch (updateType) {
      case UpdateType.AddToTop:
        this.insertRule(updatedNetworkRules[0], -1);
        break;
      case UpdateType.Insert:
        this.insertRule(updatedNetworkRules[0], targetIndex);
        break;
      case UpdateType.Edit:
        this.replaceRule(updatedNetworkRules[0], targetIndex);
        break;
      case UpdateType.MoveUp:
        this.moveRules(updatedNetworkRules, targetIndex, updateType);
        break;
      case UpdateType.MoveDown:
        this.moveRules(updatedNetworkRules, targetIndex, updateType);
        break;
    }
  };

  isNetworkRuleDirty = (): Boolean => {
    return this.networkRulesService.isNetworkRuleChanged;
  };

  addNetworkRuleToTop = () => {
    const addEditDialogRef = this.dialog.open(
      AddEditNetworkRuleModalComponent,
      {
        width: '80%',
        data: {
          opType: GlobalConstant.MODAL_OP.ADD,
          networkRuleOptions: this.networkRuleOptions,
          index: -1,
          source: this.source,
          cfgType:
            this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
              ? GlobalConstant.SCOPE.FED
              : GlobalConstant.SCOPE.LOCAL,
          updateGridData: this.updateGridData,
        },
        disableClose: true,
      }
    );
  };

  openMoveNetworkRulesModal = () => {
    const addEditDialogRef = this.dialog.open(MoveNetworkRulesModalComponent, {
      width: '450px',
      data: {
        selectedNetworkRules: this.selectedNetworkRules,
        networkRules: this.networkRules,
        updateGridData: this.updateGridData,
      },
      disableClose: true,
    });
  };

  promoteRuleOnTop = () => {
    let payload = {
      request: {
        ids: this.selectedNetworkRules.map(rule => rule.id),
      },
    };
    this.networkRulesService.promoteNetworkRulesData(payload).subscribe(
      res => {
        setTimeout(() => {
          this.refresh();
        }, 2000);
      },
      err => {}
    );
  };

  removeNetworkRules = () => {
    let ids = this.selectedNetworkRules.map(rule => rule.id);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: `${this.translate.instant(
          'policy.dialog.REMOVE'
        )} - ${ids.join(', ')}`,
        isSync: true,
      },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.maskingDeletedRows(ids);
      }
    });
  };

  private getServiceRules = () => {
    this.groupsService.getService(this.groupName).subscribe({
      next: service => {
        this.gridOptions.api!.setRowData(service.policy_rules);
      },
      error: err => {
        console.warn(err);
        if (err.status !== GlobalConstant.STATUS_NOT_FOUND) {
          this.gridOptions.overlayNoRowsTemplate =
            this.utils.getOverlayTemplateMsg(err);
        }
        this.gridOptions.api!.setRowData([]);
      },
    });
  };

  private getGroupPolicy = () => {
    this.groupsService.getGroupInfo(this.groupName).subscribe(
      (response: any) => {
        this.gridOptions.api!.setRowData(response.policy_rules);
      },
      error => {}
    );
  };

  private getNetworkRules = () => {
    this.eof = false;
    this.networkRulesService.isNetworkRuleChanged = false;
    this.networkRuleErr = false;
    this.networkRules = [];
    this.createRuleWorker();
    this.utils.loadPagedData(
      PathConstant.POLICY_URL,
      this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? {
            start: 0,
            limit: MapConstant.PAGE.NETWORK_RULES,
            scope: GlobalConstant.SCOPE.FED,
          }
        : {
            start: 0,
            limit: MapConstant.PAGE.NETWORK_RULES,
          },
      null,
      this.mergeRulesByWebWorkerClient,
      this.handleError
    );
  };

  submit = () => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: this.translate.instant('policy.POLICY_DEPLOY_CONFIRM'),
      },
      disableClose: true,
    });
    // listen to confirm subject
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.networkRulesService.submitNetworkRule(
            this.networkRules,
            this.source
          );
        })
      )
      .subscribe(
        res => {
          console.log(res);
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
          // confirm actions
          setTimeout(() => {
            this.gridOptions.api!.deselectAll();
            this.getNetworkRules();
          }, 2000);
        },
        error => {
          console.log('error', error);
          if (MapConstant.USER_TIMEOUT.indexOf(error.status) < 0) {
            if (
              error.status === 400 &&
              error.data &&
              error.data.code === READONLY_RULE_MODIFIED
            ) {
              // Alertify.alert(
              //   `${Utils.getAlertifyMsg(error, $translate.instant("policy.dialog.content.SUBMIT_NG"), true)}
              //   <div>Read-only rule ID is: ${error.data.read_only_rule_ids.join(", ")}</div>
              //   <div>You can click revert button on the rule to rollback your change.</div>`
              // );
              this.changeState4ReadOnlyRules(error.data.read_only_rule_ids);
            } else {
              // Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              // Alertify.error(
              //   Utils.getAlertifyMsg(error, $translate.instant("policy.dialog.content.SUBMIT_NG"), false)
              // );
            }
          }
        }
      );
  };

  exportCsv = () => {
    let reportData: Array<any> = [];
    this.gridOptions.api!.forEachNodeAfterFilterAndSort((node, index) => {
      reportData.push({
        sequence: index + 1,
        id: node.data.id,
        comment: node.data.comment,
        from: node.data.from,
        to: node.data.to,
        applications: node.data.applications,
        ports: node.data.ports,
        action: node.data.action,
        type: MapConstant.DISPLAY_CFG_TYPE_MAP[
          node.data.cfg_type.toLowerCase()
        ],
        status: node.data.disable ? 'disabled' : 'enabled',
        updated_at: this.datePipe.transform(
          node.data.last_modified_timestamp * 1000,
          'MMM dd, y HH:mm:ss'
        ),
      });
    });

    let csv = arrayToCsv(reportData);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(
      blob,
      `Network_rules_Reports_${this.utils.parseDatetimeStr(new Date())}.csv`
    );
  };

  print = () => {
    this.isPrinting = true;
    setInterval(() => {
      if (this.printableReportView) {
        window.print();
        this.isPrinting = false;
      }
    }, 500);
  };

  private createRuleWorker = () => {};

  private changeState4ReadOnlyRules = readOnlyruleIds => {
    readOnlyruleIds.forEach(readOnlyruleId => {
      let index = this.networkRules.findIndex(
        rule => rule.id === readOnlyruleId
      );
      this.networkRules[index].state =
        GlobalConstant.NETWORK_RULES_STATE.READONLY;
    });
    this.gridOptions.api!.setRowData(this.networkRules);
  };

  private mergeRulesByWebWorkerClient = (rulesBlock: Array<any>) => {
    let eof = rulesBlock.length < MapConstant.PAGE.NETWORK_RULES;
    this.networkRules = this.networkRules.concat(rulesBlock);
    this.renderNetworkRule(this.networkRules, eof);
  };

  private handleError = () => {
    this.networkRuleErr = true;
    this.renderNetworkRule([], true);
  };

  private renderNetworkRule = (networkRules, eof) => {
    this.eof = eof;
    if (networkRules.some(row => row.id === -1)) {
      networkRules.pop();
    }
    networkRules.push({
      id: -1,
      from: this.translate.instant('policy.DEFAULT_RULE'),
      to: '',
      application: [],
      ports: '',
      action: '',
      last_modified_timestamp: '',
    });
    this.filteredCount = networkRules.length;
    this.gridOptions.api!.setRowData(networkRules);
  };

  private insertRule = (
    updatedNetworkRule: NetworkRule,
    targetIndex: number
  ) => {
    this.networkRules.splice(targetIndex, 0, updatedNetworkRule);
    this.networkRulesService.isNetworkRuleChanged = true;
    setTimeout(() => {
      this.gridOptions.api!.setRowData(this.networkRules);
      // this.gridOptions.api!.redrawRows();
      this.gridOptions.api!.ensureIndexVisible(targetIndex, 'top');
    }, 500);
  };

  private replaceRule = (
    updatedNetworkRule: NetworkRule,
    targetIndex: number
  ) => {
    this.networkRules.splice(targetIndex, 1, updatedNetworkRule);
    let row = this.gridOptions.api!.getDisplayedRowAtIndex(targetIndex)!;
    row.setData(updatedNetworkRule);
    this.gridOptions.api!.redrawRows({ rowNodes: [row] });
    this.networkRulesService.isNetworkRuleChanged = true;
    setTimeout(() => {
      this.gridOptions.api!.ensureIndexVisible(targetIndex, 'top');
    }, 500);
  };

  private moveRules = (
    selectedNetworkRules: Array<NetworkRule>,
    targetIndex: number,
    moveType: UpdateType
  ) => {
    let selectedRuleId = selectedNetworkRules.map(rule => rule.id);
    let networkRulesTmp = this.networkRules.filter(rule => {
      return !selectedRuleId.includes(rule.id);
    });
    if (moveType === UpdateType.MoveUp) {
      networkRulesTmp.splice(targetIndex, 0, ...selectedNetworkRules);
    } else {
      networkRulesTmp.splice(targetIndex + 1, 0, ...selectedNetworkRules);
    }
    this.networkRules = networkRulesTmp;
    this.gridOptions.api!.setRowData(this.networkRules);
    // this.gridOptions.api!.redrawRows();
    this.networkRulesService.isNetworkRuleChanged = true;
  };

  private maskingDeletedRows = (ids: Array<number>) => {
    let index = 0;
    this.networkRules = this.networkRules.map(rule => {
      if (rule.id === ids[index]) {
        rule.remove = true;
        index++;
      }
      return rule;
    });
    this.gridOptions.api!.setRowData(this.networkRules);
    // this.gridOptions.api!.redrawRows();
    this.networkRulesService.isNetworkRuleChanged = true;
  };

  private bindRouteEventListener = () => {
    const currentRoute = this.router.routerState;
    if (!this.routeEventSubscription) {
      this.routeEventSubscription = this.router.events
        .pipe(
          filter((event): event is NavigationStart => {
            console.log('event', event);
            return (
              event instanceof NavigationStart &&
              `#${currentRoute.snapshot.url}` === location.hash
            );
          })
        )
        .subscribe(event => {
          if (
            this.isNetworkRuleDirty() &&
            !confirm(this.translate.instant('policy.dialog.reminder.MESSAGE'))
          ) {
            this.router.navigateByUrl(currentRoute.snapshot.url, {
              skipLocationChange: true,
            });
          }
        });
    }
  };

  private unbindRouteEventListener = () => {
    this.routeEventSubscription.unsubscribe();
  };
}