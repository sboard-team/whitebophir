(function adsManaging() {
    const adBanner = document.getElementById('banner-ad');
    const closeAd = adBanner.querySelector('.closeAd');
    const closedAdBanner = document.querySelector('.closedBanner');
    const closeAdBanner = closedAdBanner.querySelector('.closeAd');
    const disableAdsBtn = closedAdBanner.querySelector('.disableAdsBtn');
   

    // Doing request that returns 2 things, show banner or not, and delay of showing that banner

    function getShowAdBanner() {
        let url = Tools.server_config.API_URL + 'ads/can-show';
        fetch(url,
        {   
                headers: new Headers({
                    'Accept': 'application/json',
                }),
                method: 'GET',
                credentials: 'include',
            
        })
        .then(response => response.json())
        .then(data => {
            if (!data.canShow) return;
            else {
                let showAdBanner = new Timer(1000, data.intervalSeconds);

                closeAd.addEventListener('click', () => { showPopup(showAdBanner) });
                closeAdBanner.addEventListener('click', () => { closePopup(showAdBanner) });
                disableAdsBtn.addEventListener('click', () => { disableAdsForSession(showAdBanner) });
            }
        })
    }

    getShowAdBanner();

    // Set nextShowTime in session storage

    function setNextShowTime(value) {
        return sessionStorage.setItem('nextShowTime', value);
    }

    // Get nextShowTime from session storage

    function getNextShowTime() {
        return Number(sessionStorage.getItem('nextShowTime'));
    }
    
    // Function for starting, stopping and reseting timer (interval), to check current time and compare it to nextShowTime

    function Timer(dateUpd , intervalSeconds) {
        let nextShowTime = new Date(new Date().getTime() + intervalSeconds * 1000).getTime();


        // Storing nextShowTime in session storage (if we already didn't have one)

        setNextShowTime(sessionStorage.getItem('nextShowTime') || nextShowTime);

        // Timer function, when current date equal to nextShowDate (current date + delay from request, getting from session storage), we'll show ad banner and stop timer

        let func = () => {
            if (!((Date.now() - getNextShowTime()) < 9 > 0)) {
                adBanner.classList.remove('hide');
                this.stop();
            }
        }
        
        let timerObj = setInterval(func, dateUpd);

        // Stop timer (interval)
        this.stop = function() {
            if (timerObj) {
                clearInterval(timerObj);
                timerObj = null;
            }
            return this;
        }
    
        // Start timer with current delay (if it's not already running)
        this.start = function() {
            if (!timerObj) {
                this.stop();
                timerObj = setInterval(func, dateUpd);
            }
            return this;
        }
    
        // Start with new or original interval, stop current interval
        this.reset = function(newTimer = dateUpd) {
            dateUpd = newTimer;
            nextShowTime = new Date(new Date().getTime() + intervalSeconds * 1000).getTime();
            setNextShowTime(nextShowTime);
            return this.stop().start();
        }
    }

    // Show popup

    function showPopup(bannerInterval) {
        adBanner.classList.add('hide');
        closedAdBanner.classList.remove('hide');
        bannerInterval.stop();
    }

    // Close popup and set timer to show banner sum delay (from request) after its closing

    function closePopup(bannerInterval) {
        closedAdBanner.classList.add('hide');
        bannerInterval.reset();
    }

    // If user clicked on 'Отключить насовсем', clear interval and dont show ad banner for session, remove nextShowTime from session storage

    function disableAdsForSession(bannerInterval) {
        closedAdBanner.classList.add('hide');
        sessionStorage.removeItem('nextShowTime');
        bannerInterval.stop();
    }
})() 