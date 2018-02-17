const styles = {
  ul: 'style="font-size: 18px;font-family: Verdana,Geneva,sans-serif;line-height: 1.5;color: #4e4e4e;padding-left: 24px"',
  h2: 'style="font-size: 34px;margin-bottom: 0;"',
  p: 'style="font-size: 18px;font-family: Verdana,Geneva,sans-serif;line-height: 1.5;color: #4e4e4e;"'
};

const createChangeTable = data => {
  let tableBody;
  const tableStyle = 'style="border-collapse: collapse; border: solid #e0e0dc; border-width: 1px 0 0 1px; width: 100%;"'
  const headCellStyle = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: left;background: rgba(212,221,228,.5);"'
  const cellStyle = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: left;"'
  const tableHead = `<thead><tr><th ${headCellStyle}>Repo</th><th ${headCellStyle}>Then</th><th ${headCellStyle}>Now</th><th ${headCellStyle}>Change</th></tr></thead>`;

  if (data.length > 0) {
    tableBody = data.reduce((string, item) => {
      const direction = ((item.gpa.now - item.gpa.then) > 0) ? '➕' : '➖';
      const name = `<td ${cellStyle}>${item.name}</td>`;
      const then = `<td ${cellStyle}>${item.gpa.then}</td>`;
      const now = `<td ${cellStyle}>${item.gpa.now}</td>`;
      const change = `<td ${cellStyle}>${direction} ${Math.abs((item.gpa.now - item.gpa.then).toFixed(3))}</td>`;
      return `${string}<tr>${name}${then}${now}${change}</tr>`;
    }, '');
  } else {
    tableBody = `<tr><td>Move along...nothing to see here.</td><td></td><td></td><td></td></tr>`;
  }

  return `<table ${tableStyle}>${tableHead}<tbody>${tableBody}</tbody></table>`;
};

const createEmailString = table => {
  return `<div style="width: 500px; margin: 0 auto;">
  <p ${styles.p}><strong>Just what you were hoping for! Another email!</strong> In this email we'll take a look at recent changes in our project's CodeClimate GPAs and call out the ones with big movements. I bet you thought you were done getting grades and report cards! Well, think again!</p>
  <p ${styles.p}><em>A few notes: The CodeClimate API is still in beta so it's liiiiiittle unpredictable and undocumented. As such, I can't guarantee the accuracy or consistency of this email, but hopefully one day it grows into a beautiful <a href="https://youtu.be/PDBBCuw_Rpc">delicate little flower.</a></em></p>
  <h2 ${styles.h2}>📈 Movers and Shakers</h2>
  <hr>
  <p ${styles.p}>Here are the big changes between ${then} and ${now}:</p>
  ${table}
  <p ${styles.p}>Boy, wasn't that some good data?!?? Be on the lookout for this same email next week!<br><br>Until then, stay sexy and don't get murdered yall!</p>
  <p ${styles.p}>- <a href="https://github.com/tshamz">@tshamz</a></p>
</div>`;
};
