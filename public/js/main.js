function sendRequest(options) {
  const request = new XMLHttpRequest();

  o = {
    url: null,
    method: "GET",
    onComplete: null,
    onSuccess: null,
    onError: null,
    ...options
  }

  request.onreadystatechange = function () {
    if (this.readyState == 4) {
      const data = JSON.parse(this.responseText);

      if (o.onComplete) {
        o.onComplete(data);
      }

      if (this.status == 200) {
        if (o.onSuccess) {
          o.onSuccess(data);
        }
      } else {
        if (o.onError) {
          o.onError(data);
        }
      }
    }
  };

  request.open(o.method, o.url, true);
  request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  if (o.data) {
    request.send(JSON.stringify(o.data));
  } else {
    request.send();
  }
}

let houseData;

sendRequest({
  url: `/api/house/${HOUSE_ID}`,
  method: "GET",
  onSuccess: (data) => {
    houseData = data.data;

    fillContainer(houseData);

    const paths = location.pathname.split("/")
    if (paths.indexOf("internal") > 0 && paths.indexOf("family") > 0) {
      try {
        const internal = parseInt(paths[paths.indexOf("internal") + 1])
        const family = parseInt(paths[paths.indexOf("family") + 1])

        fillDoorbell(houseData.Internals[internal].Families[family], data.data.Internals[internal])
      } catch (error) { }
    }
  },
  onError: (data) => {
    console.log(data.data);
  }
});

addEventListener('popstate', () => {
  fillContainer(houseData);
});