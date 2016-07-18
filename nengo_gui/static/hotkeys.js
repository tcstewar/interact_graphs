/**
 * Manages hotkeys.
 *
 * @constructor
 */
var Hotkeys = function(editor, modal) {
    var self = this;

    this.active = true;
    this.editor = editor;
    this.netgraph = this.editor.netgraph;
    this.modal = modal;

    document.addEventListener('keydown', function(ev) {
        if (self.active) {

            var on_editor = (ev.target.className === 'ace_text-input');

            if (typeof ev.key != 'undefined') {
                var key = ev.key;
            } else {
                switch (ev.keyCode) {
                    case 191:
                        var key = '?';
                        break;
                    case 8:
                        var key = 'backspace';
                        break;
                    case 13:
                        var key = 'enter';
                        break;
                    default:
                        var key = String.fromCharCode(ev.keyCode);
                }
            }
            var key = key.toLowerCase();
            var ctrl = ev.ctrlKey || ev.metaKey;

            // Toggle editor with ctrl-e
            if (ctrl && key == 'e') {
                self.editor.toggle_shown();
                ev.preventDefault();
            }
            // Undo with ctrl-z
            if (ctrl && key == 'z') {
                self.netgraph.notify({undo: "1"});
                ev.preventDefault();
            }
            // Redo with shift-ctrl-z
            if (ctrl && ev.shiftKey && key == 'z') {
                self.netgraph.notify({undo: "0"});
                ev.preventDefault();
            }
            // Redo with ctrl-y
            if (ctrl && key == 'y') {
                self.netgraph.notify({undo: "0"});
                ev.preventDefault();
            }
            // Save with save-s
            if (ctrl && key == 's') {
                self.editor.save_file();
                ev.preventDefault();
            }
            // Run model with spacebar or with shift-enter
            if ((key == ' ' && !on_editor) ||
                    (ev.shiftKey && key == 'enter')) {
                if (!ev.repeat) {
                    sim.on_pause_click();
                }
                ev.preventDefault();
            }
            // Bring up help menu with ?
            if (key == '?' && !on_editor) {
                self.callMenu();
                ev.preventDefault();
            }
            // Bring up minimap with ctrl-m
            if (ctrl && key == 'm') {
                self.netgraph.toggleMiniMap();
                ev.preventDefault();
            }
            // Disable backspace navigation
            if (key == 'backspace' && !on_editor) {
                ev.preventDefault();
            }
            // Toggle auto-updating with TODO: pick a good shortcut
            if (ctrl && ev.shiftKey && key == '1') {
                self.editor.auto_update = !self.editor.auto_update;
                self.editor.update_trigger = self.editor.auto_update;
                ev.preventDefault();
            }
            // Trigger a single update with TODO: pick a good shortcut
            if (ctrl && !ev.shiftKey && key == '1') {
                self.editor.update_trigger = true;
                ev.preventDefault();
            }
        }
    });
};

Hotkeys.prototype.callMenu = function() {
    this.modal.title("Hotkeys list");
    this.modal.footer('close');
    this.modal.help_body();
    this.modal.show();
};

/**
 * Turn hotkeys on or off.
 *
 * set_active is provided with a boolean argument, which will either
 * turn the hotkeys on or off.
 */
Hotkeys.prototype.set_active = function(bool) {
    console.assert(typeof(bool) == 'boolean');
    this.active = bool;
};

module.exports = Hotkeys;
