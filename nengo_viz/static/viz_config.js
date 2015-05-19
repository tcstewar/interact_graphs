// Original JavaScript code by Chirp Internet: www.chirp.com.au
// Please acknowledge use of this code by including this header.

VIZ.Config = function() {
    var self = this

    // Create the config window
    var modalWrapper = document.createElement('div');
    var modalWindow = document.createElement('div');
    modalWrapper.id = 'modal_wrapper';
    modalWindow.id = 'modal_window';
    modalWindow.innerHTML = '<p>Config menu</p>';
    modalWrapper.appendChild(modalWindow);
    // Add it to the main page
	var main = document.getElementById('main');
    main.appendChild(modalWrapper);

    this.is_showing = false;

    openModal = function(e) {
        console.log(self);
        console.log(self.is_showing);

        if (self.is_showing == false) {
            modalWrapper.className = "overlay";
            modalWindow.style.marginTop = (-modalWindow.offsetHeight)/2 + "px";
            modalWindow.style.marginLeft = (-modalWindow.offsetWidth)/2 + "px";
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            self.is_showing = true;
        }
        else {
            closeModal(e);
        }
    };

    closeModal = function(e) {
        modalWrapper.className = "";
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
        self.is_showing = false;
    };

    clickHandler = function(e) {
        if(!e.target) e.target = e.srcElement;
        if(e.target.tagName == "DIV") {
          if(e.target.id != "modal_window") closeModal(e);
        }
    };

    keyHandler = function(e) {
        if(e.keyCode == 27) closeModal(e);
    };

    if(document.addEventListener) {
        document.getElementById("modal_open").addEventListener('click', 
                openModal);
        document.addEventListener("click", clickHandler, false);
        document.addEventListener("keydown", keyHandler, false);
    } 
    else {
        document.getElementById("modal_open").attachEvent("onclick", 
                openModal);
        document.attachEvent("onclick", clickHandler);
        document.attachEvent("onkeydown", keyHandler);
    }
};



>>>>>>> moved config out of template