function fillTemplate(tmp, o) {
  template = { ...tmp };

  Object.keys(template).map(function (key, _) {
    template[key] = o[tmp[key]];
  });

  return template;
}

function groupJSON(arr, tmpGroup, groupKey, tmpData, arrKey) {

  groupedJSON = arr.reduce((r, o) => {
    template = fillTemplate(tmpGroup, o);
    template[arrKey] = [];

    r[o[groupKey]] = r[o[groupKey]] || template;

    currData = fillTemplate(tmpData, o);
    r[o[groupKey]][arrKey].push(currData);

    return r;
  }, []);

  return groupedJSON.filter((e) => e);
}

module.exports = { groupJSON };