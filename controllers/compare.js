export default async function compare(newer, older) {
  const comparisonSummary = {
    newer: newer.runName,
    older: older.runName,
  };
  Object.keys(newer.summary).forEach((query) => {
    if (older.summary.hasOwnProperty(query)) {
      const oldRes = older.summary[query];
      const newRes = newer.summary[query];
      let comparison;
      if (oldRes.hasOwnProperty('error') && !newRes.hasOwnProperty('error')) {
        comparison = {
          changed: true,
          changes: "Old query failed with error",
          error: oldRes.error,
          newResults: { ...newRes },
        }
      } else if (!oldRes.hasOwnProperty('error') && newRes.hasOwnProperty('error')) {
        comparison = {
          changed: true,
          changes: "New query failed with error",
          error: newRes.error,
          oldResults: { ...oldRes },
        }
      } else {
        const itemsToCheck = [
          oldRes.status === newRes.status,
          oldRes.responseMB === newRes.responseMB,
          oldRes.responseKB === newRes.responseKB,
          oldRes.response.nodes === newRes.response.nodes,
          oldRes.response.edges === newRes.response.edges,
          oldRes.response.results === newRes.response.results,
        ];
        const changed = !itemsToCheck.every((check) => check);
        comparison = {
          changed: changed,
          status: `${oldRes.status} -> ${newRes.status}`,
          responseTime: `${oldRes.responseTime} -> ${newRes.responseTime}`,
          responseMB: `${oldRes.responseMB} -> ${newRes.responseMB}`,
          responseKB: `${oldRes.responseKB} -> ${newRes.responseKB}`,
          response: {
            nodes: `${oldRes.response.nodes} -> ${newRes.response.nodes}`,
            edges: `${oldRes.response.edges} -> ${newRes.response.edges}`,
            results: `${oldRes.response.results} -> ${newRes.response.results}`,
            olderLink: oldRes.response.link,
            newerLink: newRes.response.link,
          },
        };
      }
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
