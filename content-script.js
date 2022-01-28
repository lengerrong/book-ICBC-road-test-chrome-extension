var CURRENT_TAB_ID = null;
const {
  colors,
  CssBaseline,
  ThemeProvider,
  Typography,
  Container,
  createTheme,
  Box,
  Snackbar,
  Alert,
  AlertTitle
} = MaterialUI; // Create a theme instance.

const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6'
    },
    secondary: {
      main: '#19857b'
    },
    error: {
      main: colors.red.A400
    }
  }
});
const signInHint = {
  title: 'Check it out!',
  description: 'Fill the entries and click "Sign in" button to start book your road test automatically!'
};

const waitFor = preTest => {
  return new Promise(resolve => {
    let waitTimer = setInterval(() => {
      if (preTest()) {
        clearInterval(waitTimer);
        resolve();
      }

      console.log("waiting...");
    }, 50);
  });
};

const AutoHint = ({
  title,
  description
}) => {
  const [open, setOpen] = React.useState(true);

  const handleClose = () => setOpen(false);

  return /*#__PURE__*/React.createElement(Snackbar, {
    sx: {
      height: '100%'
    },
    anchorOrigin: {
      vertical: "top",
      horizontal: "center"
    },
    open: open,
    onClose: handleClose
  }, /*#__PURE__*/React.createElement(Alert, {
    onClose: handleClose,
    severity: "info",
    sx: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(AlertTitle, null, title), description));
};

const getTabStorage = () => {
  return new Promise(resolve => {
    chrome.storage.local.get(CURRENT_TAB_ID, result => {
      resolve(result[CURRENT_TAB_ID]);
    });
  });
};

const getLocalStorage = async key => {
  const tabStorage = await getTabStorage();
  return tabStorage?.[key];
};

const setLocalStorage = async (key, value) => {
  const tabStorage = await getTabStorage();
  const newStorage = { ...tabStorage,
    [key]: value
  };
  return new Promise(resolve => {
    chrome.storage.local.set({
      [CURRENT_TAB_ID]: newStorage
    }, result => {
      resolve(result);
    });
  });
};

const dispatchEvent = (target, type) => {
  const event = new Event(type);
  target.dispatchEvent(event);
};

const inputChange = (target, value) => {
  target.value = value;
  dispatchEvent(target, 'input');
  dispatchEvent(target, 'change');
  dispatchEvent(target, 'keyup');
  dispatchEvent(target, 'focus');
  dispatchEvent(target, 'focusin');
};

const CREDENTAIL_KEY = "credentials";
var completed = false;

const DriverLogin = () => {
  const [credential, setCredential] = React.useState(null);

  const signInButton = () => document.querySelector('button.mat-raised-button');

  const lastNameInput = () => document.querySelectorAll('input')[0];

  const licenseNumberInput = () => document.querySelectorAll('input')[1];

  const keyWordInput = () => document.querySelectorAll('input')[2];

  const termsCheckbox = () => document.querySelectorAll('input')[3];

  React.useEffect(async () => {
    completed = false;

    const signInCallback = () => {
      setLocalStorage(CREDENTAIL_KEY, {
        lastName: lastNameInput().value,
        licenseNumber: licenseNumberInput().value,
        keyWord: keyWordInput().value
      });
    };

    const clickSignin = () => {
      signInButton().click(); // if entries are good, window.location will navigate to below
      // https://onlinebusiness.icbc.com/webdeas-ui/driver
      // https://onlinebusiness.icbc.com/webdeas-ui/booking
    };

    signInButton().addEventListener('click', signInCallback);
    let value = await getLocalStorage(CREDENTAIL_KEY);
    setCredential(value);

    if (value) {
      await waitFor(keyWordInput);
      const {
        lastName,
        licenseNumber,
        keyWord
      } = value;
      keyWordInput().addEventListener("input", clickSignin);
      termsCheckbox().click();
      inputChange(lastNameInput(), lastName);
      inputChange(licenseNumberInput(), licenseNumber);
      inputChange(keyWordInput(), keyWord);
    }

    return () => {
      signInButton().removeEventListener('click', signInCallback);
      keyWordInput().removeEventListener("input", clickSignin);
    };
  }, []);

  if (credential) {
    return null;
  }

  return /*#__PURE__*/React.createElement(AutoHint, signInHint);
};

const findRaisedButtonByText = text => {
  return Array.from(document.querySelectorAll('button.mat-raised-button')).filter(n => n.innerText.includes(text))[0];
};

const findStrokeButtonByText = text => {
  return Array.from(document.querySelectorAll('button.mat-stroked-button')).filter(n => n.innerText.includes(text))[0];
};

const APPOINTMENT_TIME_KEY = "appointment-time";

const RescheduleAppointment = () => {
  console.log("RescheduleAppointment mounted");
  React.useEffect(() => {
    if (completed) {
      return;
    }

    let interval = setInterval(() => {
      let adt = document.querySelector('.appointment-time');

      if (adt) {
        clearInterval(interval);
        setLocalStorage(APPOINTMENT_TIME_KEY, adt.innerText.split('\n')[0]);
        findRaisedButtonByText('Reschedule appointment').click();
        findRaisedButtonByText('Yes').click(); // will navigate to https://onlinebusiness.icbc.com/webdeas-ui/booking
      }
    }, 100);
    return () => {
      console.log("RescheduleAppointment unmounted");
      clearInterval(interval);
    };
  }, []);
  return /*#__PURE__*/React.createElement(React.Fragment, null);
};

const searchingDone = () => {
  return new Promise(resolve => {
    let searchingInterval = setInterval(() => {
      if (document.body.innerText.indexOf('SEARCHING') == -1) {
        clearInterval(searchingInterval);
        resolve();
      }

      console.log("still searching...");
    }, 50);
  });
}; // random chose the nearest 2 locations


const icbcOfficeDiv = () => document.querySelectorAll('div.appointment-location-wrapper')[Math.round(Math.random())];

const option = () => document.querySelector('mat-option');

const searchButton = () => findRaisedButtonByText('Search');

var found = false;
const completedSong = new Audio('https://raw.githubusercontent.com/lengerrong/lengerrong.github.io/master/donz_ricky-martin-go-go-go-ale-ale-ale.mp3');

const pauseSong = () => {
  completedSong.pause();
  completedSong.currentTime = 0;
};

const AutoBook = () => {
  const [retry, setRetry] = React.useState(false);
  React.useEffect(async () => {
    console.log("AutoBook mount");

    if (found || completed) {
      return;
    }

    let searchTimer = setInterval(async () => {
      try {
        if (!icbcOfficeDiv()) {
          option()?.click();
          searchButton()?.click();
          return;
        }

        icbcOfficeDiv().click();
        pauseSong();
        await searchingDone();
        console.log("search done!");

        if (document.body.innerText.indexOf('Hmm, looks like something went wrong on our end. Please try again later.') != -1) {
          clearInterval(searchTimer);
          found = false;
          window.location.href = "https://onlinebusiness.icbc.com/webdeas-ui/login;type=driver";
          return;
        }

        let firstAvalableDate = () => document.querySelector('.date-title');

        if (!firstAvalableDate()) {
          return;
        }

        let dateAfter30Days = () => {
          let earliestDate = firstAvalableDate().textContent.trim();
          earliestDate = earliestDate.substring(earliestDate.indexOf(',') + 1).trim();
          earliestDate = earliestDate.match(/(\w+) (\d+)\w+, (\d+)/);
          earliestDate = earliestDate[1] + ' ' + earliestDate[2] + ' ' + earliestDate[3];
          earliestDate = new Date(earliestDate);
          let day30later = new Date();
          day30later.setDate(day30later.getDate() + 30);
          return earliestDate.getTime() > day30later;
        };

        if (dateAfter30Days()) {
          console.log(firstAvalableDate().innerText, "is a bit too later, try search again");
          return;
        }

        let tb = () => document.querySelector('button.mat-button-toggle-button');

        console.log('Chose the earilest time slot on', firstAvalableDate().innerText, 'at', tb().textContent.trim()); // choose the earilest time slot and click 'Review Appointment'

        let reviewButton = () => document.querySelector('.mat-raised-button.mat-button-base.mat-accent.ng-star-inserted');

        while (reviewButton().disabled) {
          tb().click();
        }

        if (!found) {
          reviewButton().click();
          found = true;
        } // play go go go ale ale......


        completedSong.play();
        clearInterval(searchTimer);

        const onCancelBook = () => {
          found = false;
          pauseSong();
          setRetry(!retry);
        };

        const cancelButton = () => Array.from(document.querySelectorAll('button.mat-stroked-button')).filter(n => n.innerText.includes('Cancel'))[1];

        await waitFor(cancelButton);

        const nextButton = () => findRaisedButtonByText('Next');

        const onNextBook = () => {
          completed = true;
          pauseSong();
        };

        nextButton().addEventListener("click", onNextBook);
        cancelButton().addEventListener("click", onCancelBook);
      } catch (e) {
        console.error(e);
        found = false;
        pauseSong();
        clearInterval(searchTimer);
        setRetry(!retry);
      }
    }, 300);
    return () => {
      console.log("AutoBook unmount");
      clearInterval(searchTimer);
      completedSong.pause();
      completedSong.currentTime = 0;
    };
  }, [retry]);
  return completed && /*#__PURE__*/React.createElement(React.Fragment, null);
};

const LOCATIONDETAILS_KEY = "locationdetails";
const searchLocationHint = {
  title: 'Search location!',
  description: 'Please fill location and dates and click "Search" button to continue your auto booking!'
};

const BookRoadTest = () => {
  const [auto, setAuto] = React.useState(false);
  const [locationDetails, setLocationDetails] = React.useState(null);

  const locationInput = () => document.querySelector('input.mat-autocomplete-trigger.mat-input-element');

  React.useEffect(async () => {
    if (document.body.innerText.indexOf('Select a location to view all available appointments') != -1) {
      setAuto(true);
      return;
    }

    const searchLocationCallback = () => {
      const locations = locationInput().value;
      setLocalStorage(LOCATIONDETAILS_KEY, {
        locations
      });
      setLocationDetails({
        locations
      });
      setAuto(true);
    };

    searchButton().addEventListener('click', searchLocationCallback);
    const value = await getLocalStorage(LOCATIONDETAILS_KEY);
    setLocationDetails(value);

    if (value) {
      const {
        locations
      } = value;
      inputChange(locationInput(), locations);
      let opt = setInterval(() => {
        if (option()) {
          clearInterval(opt);
          option().click();
          searchButton().click();
          setAuto(!auto);
        }
      }, 100);
      setAuto(!auto);
    }

    return () => {
      searchButton().removeEventListener('click', searchLocationCallback);
      clearInterval(opt);
    };
  }, []);

  if (auto) {
    return /*#__PURE__*/React.createElement(AutoBook, null);
  }

  return !locationDetails && /*#__PURE__*/React.createElement(AutoHint, searchLocationHint);
};

const App = () => {
  console.log("App rendered!!!", location.href);
  React.useEffect(() => {
    return () => {
      console.log("App unmounted!!!", location.href);
    };
  }, []);

  if (location.href.includes('https://onlinebusiness.icbc.com/webdeas-ui/login;type=driver')) {
    // at the login page
    return /*#__PURE__*/React.createElement(DriverLogin, null);
  }

  if (location.href.includes('https://onlinebusiness.icbc.com/webdeas-ui/driver')) {
    // login success fully and have upcoming appointments
    return /*#__PURE__*/React.createElement(RescheduleAppointment, null);
  }

  if (location.href.includes('https://onlinebusiness.icbc.com/webdeas-ui/booking')) {
    // login success fully and have upcoming appointments
    if (document.body.innerText.indexOf('re fully booked!') != -1) {
      // will re-route to /webdeas-ui/driver' screen
      document.querySelector('a.ng-star-inserted').click();
      return /*#__PURE__*/React.createElement(RescheduleAppointment, null);
    }

    return /*#__PURE__*/React.createElement(BookRoadTest, null);
  }

  if (location.href.includes("https://onlinebusiness.icbc.com/webdeas-ui/home")) {
    findRaisedButtonByText("Next").click();
  }

  return /*#__PURE__*/React.createElement(React.Fragment, null);
};

const root = document.createElement('div');
root.setAttribute('id', 'icbc-auto-root');
document.body.appendChild(root);

const renderApp = () => {
  console.log("call render app"); // this function can be called manually.
  // since the internal navigations do not reload the page.
  // every time route changes, please call this function.

  ReactDOM.render( /*#__PURE__*/React.createElement(ThemeProvider, {
    theme: theme
  }, /*#__PURE__*/React.createElement(CssBaseline, null), /*#__PURE__*/React.createElement(App, null)), root);
};

chrome.runtime.sendMessage({
  type: "CONTENT_HELLO"
}, res => {
  CURRENT_TAB_ID = res.tabId.toString();
  console.log("CONTENT_HELLO", CURRENT_TAB_ID);
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('onMessage', request);

  if (request.type === 'TAB_UPDATED' && (!CURRENT_TAB_ID || request.tab.id.toString() === CURRENT_TAB_ID) && request.changeInfo.status === 'complete') {
    renderApp();
  }
});
console.log("content-scripts loaded");
const globalOopsTimer = setInterval(() => {
  if (document.body.innerText.indexOf('Hmm, looks like something went wrong on our end. Please try again later.') != -1) {
    clearInterval(globalOopsTimer);
    window.location.href = "https://onlinebusiness.icbc.com/webdeas-ui/login;type=driver";
  }
}, 5000);
