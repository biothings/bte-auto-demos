export default async function compare(newer, older) {
  const comparisonSummary = {
    newer: newer.runName,
    older: older.runName,
  };
  Object.keys(newer.summary).forEach((query) => {
    if (older.summary.hasOwnProperty(query)) {
      const oldRes = older.summary[query];
      const newRes = newer.summary[query];
      const itemsToCheck = [
        oldRes.status === newRes.status,
        oldRes.responseMB === newRes.responseMB,
        oldRes.responseKB === newRes.responseKB,
        oldRes.response.nodes === newRes.response.nodes,
        oldRes.response.edges === newRes.response.edges,
        oldRes.response.results === newRes.response.results,
      ];
      const changed = !itemsToCheck.every((check) => check);
      const comparison = {
        changed: changed,
        status: `${oldRes.status} -> ${newRes.status}`,
        responseMB: `${oldRes.responseMB} -> ${newRes.responseMB}`,
        responseKB: `${oldRes.responseKB} -> ${newRes.responseKB}`,
        response: {
          nodes: `${oldRes.nodes} -> ${newRes.nodes}`,
          edges: `${oldRes.edges} -> ${newRes.edges}`,
          results: `${oldRes.results} -> ${newRes.results}`,
          olderLink: oldRes.response.link,
          newerLink: newRes.response.link,
        },
      };
      comparisonSummary[query] = comparison;
    } else {
      comparisonSummary[query] = {
        changed: true,
        changes: "Query not present in older test.",
      };
    }
  });
  Object.keys(older.summary).forEach((query) => {
    if (!comparisonSummary.hasOwnProperty(query)) {
      comparisonSummary[query] = {
        changed: true,
        changes: "Query not present in newer test.",
      };
    }
  });
  return comparisonSummary;
}
