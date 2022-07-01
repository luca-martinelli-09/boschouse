function createToast(message, isSuccess) {
  const toastTemplate = document.getElementById("toast");

  const t = toastTemplate.content.cloneNode(true);

  t.getElementById("toast-container").classList.add(isSuccess ? "success" : "error");
  t.getElementById("toast-message").innerText = message;

  setTimeout(() => {
    for (toast of document.getElementsByClassName("toast")) {
      toast.remove();
    }
  }, 5000);

  document.body.appendChild(t);
}

function fillContainer(data) {
  const c = document.getElementById("container");
  c.innerHTML = "";

  const houseTemplate = document.getElementById("house");
  const internalTemplate = document.getElementById("internal");
  const familyCardTemplate = document.getElementById("family-card");

  const h = houseTemplate.content.cloneNode(true);

  h.getElementById("title").innerText = data.Name;
  h.getElementById("address").innerText = data.Address;

  for (i in data.Internals) {
    const internal = data.Internals[i];
    const int = internalTemplate.content.cloneNode(true);

    int.getElementById("int").innerText = "Piano " + (internal.Floor > 0 ? internal.Floor : "terra");

    for (j in internal.Families) {
      const family = internal.Families[j];
      const fam = familyCardTemplate.content.cloneNode(true);

      fam.getElementById("href").href = "/house/" + HOUSE_ID + "/internal/" + i + "/family/" + j;
      fam.getElementById("title").innerText = family.Name;
      fam.getElementById("components").innerText = family.Components.map(comp => comp.Name).join(", ");

      if (family.Message) {
        fam.getElementById("message").getElementsByTagName("span")[0].innerText = family.Message;
      } else {
        fam.getElementById("message").style.display = "none";
      }

      fam.getElementById("href").addEventListener("click", function (e) {
        e.preventDefault();

        history.pushState('family', '', this.href)
        fillDoorbell(family, internal);
      });

      int.appendChild(fam);
    }

    h.appendChild(int);
  }

  c.appendChild(h);
}

function fillDoorbell(fam, internal) {
  const c = document.getElementById("container");
  c.innerHTML = "";

  const doorbellTemplate = document.getElementById("doorbell");
  const componentTemplate = document.getElementById("fam-component");

  const d = doorbellTemplate.content.cloneNode(true);

  d.getElementById("title").innerText = fam.Name;
  d.getElementById("internal").innerText = "Piano " + (internal.Floor > 0 ? internal.Floor : "terra");

  if (fam.Message) {
    d.getElementById("message").getElementsByTagName("span")[0].innerText = fam.Message;
  } else {
    d.getElementById("message").style.display = "none";
  }

  d.getElementById("back").addEventListener("click", (e) => {
    e.preventDefault();
    history.back();
  });

  for (const component of fam.Components) {
    const co = componentTemplate.content.cloneNode(true);

    co.getElementById("comp-label").setAttribute("for", "check-co-" + component.ID)
    co.getElementById("comp-check").value = component.ID;
    co.getElementById("comp-check").setAttribute("data-name", component.Name);

    co.getElementById("comp-check").addEventListener("click", function (e) {
      if (!e.currentTarget.checked) {
        const checkboxes = document.querySelectorAll("input[name='comp']:checked");
        if (checkboxes.length + 1 >= fam.Components.length) {
          for (const checkbox of checkboxes) {
            checkbox.checked = false;
          }

          this.checked = true;
        }
      }
    });

    co.getElementById("comp-check").setAttribute("id", "check-co-" + component.ID);

    co.getElementById("title").innerHTML = "<strong>" + component.Name + "</strong> " + component.Surname;

    d.getElementById("components").appendChild(co);
  }

  d.getElementById("bell").addEventListener("click", function () {
    const checkedboxes = document.querySelectorAll("input[name='comp']:checked");
    const checkboxes = document.querySelectorAll("input[name='comp']");

    if (checkedboxes.length >= checkboxes.length) {
      sendRequest({
        url: "/api/ring/family/" + fam.ID,
        method: "POST",
        data: {
          message: document.getElementById("message-input").value
        },
        onSuccess: () => {
          createToast("Messaggio inviato", true);
        },
        onError: (data) => {
          createToast(data.error, data.ok);
        }
      });
    } else {
      for (const checkbox of checkedboxes) {
        sendRequest({
          url: "/api/ring/user/" + checkbox.value,
          method: "POST",
          data: {
            message: document.getElementById("message-input").value
          },
          onSuccess: () => {
            createToast(checkbox.getAttribute("data-name") + ": " + "Messaggio inviato", true);
          },
          onError: (data) => {
            createToast(checkbox.getAttribute("data-name") + ": " + data.error, data.ok);
          }
        });
      }
    }
  });

  c.appendChild(d);
}