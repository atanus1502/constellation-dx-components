// mock.ts — sample data page response matching runtime shape from Pega
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

export const slaRows = [
  {
    caseID: 'C-12847',
    insKey: 'MYORG-MYAPP-WORK C-12847',
    caseClassName: 'MyOrg-MyApp-Work-Case',
    slaType: 'Resolution SLA',
    status: 'At Risk',
    percentUsed: 82,
    dueDateTime: hoursFromNow(13)
  },
  {
    caseID: 'C-12851',
    insKey: 'MYORG-MYAPP-WORK C-12851',
    caseClassName: 'MyOrg-MyApp-Work-Case',
    slaType: 'First Response',
    status: 'On Track',
    percentUsed: 53,
    dueDateTime: hoursFromNow(2)
  },
  {
    caseID: 'C-12839',
    insKey: 'MYORG-MYAPP-WORK C-12839',
    caseClassName: 'MyOrg-MyApp-Work-Case',
    slaType: 'Escalation Window',
    status: 'Overdue',
    percentUsed: 100,
    dueDateTime: hoursFromNow(-3)
  }
];

export const configProps = {
  heading: 'SLA & Deadline Tracker',
  description: 'Live SLA status across active cases',
  dataPage: 'slatracker_datapage'
};

export default configProps;
