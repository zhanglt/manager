const DASHBOARD = {
  text: '概览',
  translate: 'sidebar.nav.DASHBOARD',
  link: '/dashboard',
  icon: 'performance',
};
const NETWORK_ACTIVITY = {
  text: '网络活动',
  translate: 'sidebar.nav.NETWORK_ACTIVITY',
  link: '/graph',
  icon: 'neural_network',
};
const ASSETS = {
  text: '资产',
  translate: 'sidebar.nav.RESOURCE',
  icon: 'products',
  submenu: [
    {
      text: '平台',
      translate: 'scan.PLATFORM',
      link: '/platforms',
    },
    {
      text: '主机',
      translate: 'sidebar.nav.NODES',
      link: '/hosts',
    },
    {
      text: '容器',
      translate: 'sidebar.nav.CONTAINERS',
      link: '/workloads',
    },
    {
      text: '镜像仓库',
      translate: 'sidebar.nav.REG_SCAN',
      link: '/regScan',
    },
    {
      text: '系统组件',
      translate: 'sidebar.nav.SYSTEM_COMPONENTS',
      link: '/controllers',
    },
  ],
};
const POLICY = {
  text: '策略',
  translate: 'sidebar.nav.SECURITY',
  icon: 'policy',
  submenu: [
    {
      text: '准入控制',
      translate: 'sidebar.nav.ADMISSION_CONTROL',
      link: '/admission-control',
    },
    {
      text: '安全组',
      translate: 'sidebar.nav.GROUP',
      link: '/group',
    },
    {
      text: '网络规则',
      translate: 'sidebar.nav.POLICY',
      link: '/policy',
    },
    {
      text: '应对规则',
      translate: 'sidebar.nav.RESPONSE_POLICY',
      link: '/response-policy',
    },
    
    //{
    //  text: 'DLP Sensors',
   //   translate: 'sidebar.nav.DLP_SENSORS',
    //  link: '/dlp-sensors',
  //  },
   // {
    //  text: 'WAF Sensors',
   //   translate: 'sidebar.nav.WAF_SENSORS',
   //   link: '/waf-sensors',
  //  },
    
  ],
};
const SECURITY_RISKS = {
  text: '安全风险',
  translate: 'sidebar.nav.RISK',
  icon: 'critical_bug',
  submenu: [
    {
      text: '漏洞',
      translate: 'sidebar.nav.SCAN',
      link: '/scan',
    },
    {
      text: '漏洞处置',
      translate: 'cveProfile.TITLE',
      link: '/cveProfile',
    },
    {
      text: '合规性',
      translate: 'sidebar.nav.BENCH',
      link: '/bench',
    },
    {
      text: '合规基准',
      translate: 'cis.COMPLIANCE_PROFILE',
      link: '/cisProfile',
    },
  ],
};
const NOTIFICATIONS = {
  text: '通知',
  translate: 'sidebar.nav.NOTIFICATIONS',
  icon: 'notifications_none',
  submenu: [
    {
      text: '安全事件',
      translate: 'sidebar.nav.SECURITY_EVENT',
      link: '/security-event',
    },
    {
      text: '风险报告',
      translate: 'sidebar.nav.AUDIT',
      link: '/audit',
    },
    {
      text: '系统事件',
      translate: 'sidebar.nav.EVENT',
      link: '/event',
    },
  ],
};
const SETTINGS = {
  text: '设置',
  translate: 'sidebar.nav.SETTING',
  link: '/settings',
  icon: 'settings_suggest',
};

export const menu = [
  DASHBOARD,
  NETWORK_ACTIVITY,
  ASSETS,
  POLICY,
  SECURITY_RISKS,
  NOTIFICATIONS,
  SETTINGS,
];
