import { fuzzyCompare } from "../utils.js";

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
          fuzzyCompare(oldRes.responseMB, newRes.responseMB, 10),
          fuzzyCompare(oldRes.responseKB, newRes.responseKB, 10),
          oldRes.response.nodes === newRes.response.nodes,
          oldRes.response.edges === newRes.response.edges,
          oldRes.response.results === newRes.response.results,
          typeof oldRes.response.totalNodeAttributes !== 'undefined'
            ? typeof newRes.response.totalNodeAttributes !== 'undefined'
              ? oldRes.response.totalNodeAttributes === newRes.response.totalNodeAttributes
              : undefined
            : undefined,
          typeof oldRes.response.totalEdgeAttributes !== 'undefined'
            ? typeof newRes.response.totalEdgeAttributes !== 'undefined'
              ? oldRes.response.totalEdgeAttributes === newRes.response.totalEdgeAttributes
              : undefined
            : undefined,
          typeof oldRes.response.resultSanityCheck !== 'undefined'
            ? typeof newRes.response.resultSanityCheck !== 'undefined'
              ? oldRes.response.resultSanityCheck.checkPassed === newRes.response.resultSanityCheck.checkPassed
              : undefined
            : undefined,
        ];
        const changed = !itemsToCheck.every((check) => check || typeof check === 'undefined');
        comparison = {
          changed: changed,
          status: `${oldRes.status} -> ${newRes.status}`,
          responseTime: `${oldRes.responseTime} -> ${newRes.responseTime}`,
          responseMB: `${oldRes.responseMB} -> ${newRes.responseMB}`,
          responseKB: `${oldRes.responseKB} -> ${newRes.responseKB}`,
          response: {
            nodes: `${oldRes.response.nodes} -> ${newRes.response.nodes}`,
            totalNodeAttributes: `${oldRes.response.totalNodeAttributes} -> ${newRes.response.totalNodeAttributes}`,
            edges: `${oldRes.response.edges} -> ${newRes.response.edges}`,
            totalEdgeAttributes: `${oldRes.response.totalEdgeAttributes} -> ${newRes.response.totalEdgeAttributes}`,
            results: `${oldRes.response.results} -> ${newRes.response.results}`,
            resultSanityCheck: `${oldRes.response.resultSanityCheck?.checkPassed} -> ${newRes.response.resultSanityCheck?.checkPassed}`,
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
