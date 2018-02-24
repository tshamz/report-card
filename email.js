const styles = {
  ul: 'style="font-size: 18px;font-family: Verdana,Geneva,sans-serif;line-height: 1.5;color: #4e4e4e;padding-left: 24px"',
  h2: 'style="font-size: 34px;margin-bottom: 0;"',
  h3: 'style="font-size: 26px;margin-bottom: 0;"',
  p: 'style="font-size: 18px;font-family: Verdana,Geneva,sans-serif;line-height: 1.5;color: #4e4e4e;"'
};

const createChangeTable = (data, change) => {
  const tableStyle = 'style="border-collapse: collapse; border: solid #e0e0dc; border-width: 1px 0 0 1px; width: 100%;margin-bottom: 10px;"'
  const headCellStyle = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: left;background: rgba(212,221,228,.5);"'
  const cellStyle = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: left;"'
  const cellStyleGrade = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: center;"'

  const tableHead = `<thead><tr><th ${headCellStyle}>Repo</th><th ${headCellStyle}>Maintainability Grade</th><th ${headCellStyle}>Technical Debt Ratio</th><th ${headCellStyle}>${(change) ? `Change` : `Issues`}</th></tr></thead>`;

  const tableBody = data.reduce((string, item) => {
    const name = `<td ${cellStyle}>${item.name}</td>`;
    const grade = `<td ${cellStyleGrade}>${item.now.maintainabilityGrade}</td>`;
    const ratio = `<td ${cellStyle}>${item.now.technicalDebtRatio}</td>`;
    const last = `<td ${cellStyle}>${(change) ? item.change.technicalDebtRatio : item.now.issuesCount}</td>`;
    return `${string}<tr>${name}${grade}${ratio}${last}</tr>`;
  }, '');

  return `<table ${tableStyle}>${tableHead}<tbody>${tableBody}</tbody></table>`;
};

const createEmailString = (winners, losers, random, movers) => {
  return `<div style="width: 500px; margin: 0 auto;">
  <p ${styles.p}><strong>Just what you were hoping for! Another email!</strong> In this email we'll take a look at recent changes in our project's CodeClimate GPAs and call out the ones with big movements. I bet you thought you were done getting grades and report cards! Well, think again!</p>
  <p ${styles.p}>The following metrics come from CodeClimate which is a platform used to measure and monitor code health. You can read more about the measures and ratings <a href="https://docs.codeclimate.com/docs/maintainability">here</a> and <a href="https://docs.codeclimate.com/docs/maintainability-calculation">here</a>.</p>
  <h2 ${styles.h2}>📊 Movers and Shakers</h2>
  <hr>
  <p ${styles.p}>Here are the movers and shakers from the last week:</p>
  ${movers}
  <h2 ${styles.h2}>📈 Top Sites</h2>
  <hr>
  <p ${styles.p}>Here are our current top three sites:</p>
  ${winners}
  <h2 ${styles.h2}>📉 Bottom Sites</h2>
  <hr>
  <p ${styles.p}>Here are our current bottom three sites:</p>
  ${losers}
  <h2 ${styles.h2}>🤷 Random Sites</h2>
  <hr>
  <p ${styles.p}>Here's three random sites:</p>
  ${random}
  <p ${styles.p}>Boy, wasn't that some good data?!?? Be on the lookout for this same email next week!<br><br>Until then, stay sexy and don't get murdered yall!</p>
  <p ${styles.p}>- <a href="https://github.com/tshamz">@tshamz</a></p>
</div>`;
};

module.exports = data => {
  const {top, bottom, random, moversAndShakers} = data;

  const winnersTable = createChangeTable(top, false);
  const losersTable = createChangeTable(bottom, false);
  const randomTable = createChangeTable(random, false);
  const moversAndShakersTable = createChangeTable(moversAndShakers, true);

  return createEmailString(winnersTable, losersTable, randomTable, moversAndShakersTable);

};
