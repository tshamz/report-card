const styles = {
  ul: 'style="font-size: 18px;font-family: Verdana,Geneva,sans-serif;line-height: 1.5;color: #4e4e4e;padding-left: 24px"',
  h2: 'style="font-size: 34px;margin-bottom: 0;"',
  h3: 'style="font-size: 26px;margin-bottom: 0;"',
  p: 'style="font-size: 18px;font-family: Verdana,Geneva,sans-serif;line-height: 1.5;color: #4e4e4e;"'
};

const createChangeTable = (data) => {
  const tableStyle = 'style="border-collapse: collapse; border: solid #e0e0dc; border-width: 1px 0 0 1px; width: 100%;margin-bottom: 10px;"'
  const headCellStyle = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: left;background: rgba(212,221,228,.5);"'
  const cellStyle = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: left;"'
  const tableHead = `<thead><tr><th ${headCellStyle}>Repo</th><th ${headCellStyle}>Maintainability Grade</th><th ${headCellStyle}>Issues</th></tr></thead>`;
  const tableBody = data.reduce((string, item) => {
    const name = `<td ${cellStyle}>${item.name}</td>`;
    const grade = `<td ${cellStyle}>${item.maintainabilityGrade}</td>`;
    const issues = `<td ${cellStyle}>${item.issues}</td>`;
    return `${string}<tr>${name}${grade}${issues}</tr>`;
  }, '');

  return `<table ${tableStyle}>${tableHead}<tbody>${tableBody}</tbody></table>`;
};

const createEmailString = (win, lose) => {
  return `<div style="width: 500px; margin: 0 auto;">
  <p ${styles.p}><strong>Just what you were hoping for! Another email!</strong> In this email we'll take a look at recent changes in our project's CodeClimate GPAs and call out the ones with big movements. I bet you thought you were done getting grades and report cards! Well, think again!</p>
  <h2 ${styles.h2}>📈 Movers and Shakers</h2>
  <hr>
  <p ${styles.p}>Here are the winners and losers from the last week:</p>
  <h3 ${styles.h3}>Winners</h3>
  ${win}
  <h3 ${styles.h3}>Losers</h3>
  ${lose}
  <p ${styles.p}>Boy, wasn't that some good data?!?? Be on the lookout for this same email next week!<br><br>Until then, stay sexy and don't get murdered yall!</p>
  <p ${styles.p}>- <a href="https://github.com/tshamz">@tshamz</a></p>
</div>`;
};

module.exports = data => {
  const winners = data.slice(0, 3);
  const losers = data.reverse().slice(0, 3);

  const winnersTable = createChangeTable(winners);
  const losersTable = createChangeTable(losers);

  return createEmailString(winnersTable, losersTable);

};
