/**
 *
 * Line graph showing decoded values over time
 * @constructor
 *
 * @param {DOMElement} parent - the element to add this component to
 * @param {Nengo.SimControl} sim - the simulation controller
 * @param {dict} args - A set of constructor arguments (see Nengo.Component)
 * @param {int} args.n_lines - number of decoded values
 * @param {float} args.min_value - minimum value on y-axis
 * @param {float} args.max_value - maximum value on y-axis
 *
 * Value constructor is called by python server when a user requests a plot 
 * or when the config file is making graphs. Server request is handled in 
 * netgraph.js {.on_message} function.
 */

Nengo.Value = function(parent, sim, args) {
    Nengo.Component.call(this, parent, args);
    var self = this;
    this.n_lines = args.n_lines || 1;
    this.sim = sim;
    this.display_time = args.display_time;

    /** for storing the accumulated data */
    var synapse = (args.synapse !== null) ? args.synapse : 0.01;
    this.data_store = new Nengo.DataStore(this.n_lines, this.sim, synapse);

    this.axes2d = new Nengo.TimeAxes(this.div, args);

    /** call schedule_update whenever the time is adjusted in the SimControl */
    this.sim.div.addEventListener('adjust_time',
            function(e) {self.schedule_update();}, false);

    /** call reset whenever the simulation is reset */
    this.sim.div.addEventListener('sim_reset',
            function(e) {self.reset();}, false);

    /** create the lines on the plots */
    this.line = d3.svg.line()
        .x(function(d, i) {
            return self.axes2d.scale_x(
                self.data_store.times[i + self.data_store.first_shown_index]);
            })
        .y(function(d) {return self.axes2d.scale_y(d);})
    this.path = this.axes2d.svg.append("g").selectAll('path')
                                    .data(this.data_store.data);

    this.colors = Nengo.make_colors(this.n_lines);
    this.path.enter()
             .append('path')
             .attr('class', 'line')
             .style('stroke', function(d, i) {return self.colors[i];});

    this.update();
    this.on_resize(this.get_screen_width(), this.get_screen_height());
    this.axes2d.axis_y.tickValues([args.min_value, args.max_value]);
    this.axes2d.fit_ticks(this);

    this.colors = Nengo.make_colors(6);
    this.color_func = function(d, i) {return self.colors[i % 6]};
    this.legend = document.createElement('div');
    this.legend.classList.add('legend');
    this.div.appendChild(this.legend);

    this.legend_labels = args.legend_labels || [];
    if(this.legend_labels.length !== this.n_lines){
        // fill up an array with temporary labels
        for(i=0; i<this.n_lines; i++){
            if(this.legend_labels[i] === undefined){
                this.legend_labels[i] = "label_".concat(String(i));
            }
        }
    }

    this.show_legend = args.show_legend || false;
    if(this.show_legend === true){
        Nengo.draw_legend(this.legend, this.legend_labels, this.color_func);
    }
};

Nengo.Value.prototype = Object.create(Nengo.Component.prototype);
Nengo.Value.prototype.constructor = Nengo.Value;

/**
 * Receive new line data from the server
 */
Nengo.Value.prototype.on_message = function(event) {
    var data = new Float32Array(event.data);
    data = Array.prototype.slice.call(data);
    var size = this.n_lines + 1;
    /** since multiple data packets can be sent with a single event,
    make sure to process all the packets */
    while (data.length >= size) {
        this.data_store.push(data.slice(0, size));
        data = data.slice(size);
    }
    if (data.length > 0) {
        console.log('extra data: ' + data.length);
    }
    this.schedule_update();
};

/**
 * Redraw the lines and axis due to changed data
 */
Nengo.Value.prototype.update = function() {
    /** let the data store clear out old values */
    this.data_store.update();

    /** determine visible range from the Nengo.SimControl */
    var t1 = this.sim.time_slider.first_shown_time;
    var t2 = t1 + this.sim.time_slider.shown_time;

    this.axes2d.set_time_range(t1, t2);

    /** update the lines */
    var self = this;
    var shown_data = this.data_store.get_shown_data();

    this.path.data(shown_data)
             .attr('d', self.line);
};

/**
 * Adjust the graph layout due to changed size
 */
Nengo.Value.prototype.on_resize = function(width, height) {
    if (width < this.minWidth) {
        width = this.minWidth;
    }
    if (height < this.minHeight) {
        height = this.minHeight;
    };

    this.axes2d.on_resize(width, height);

    this.update();

    this.label.style.width = width;

    this.width = width;
    this.height = height;
    this.div.style.width = width;
    this.div.style.height= height;
};

Nengo.Value.prototype.generate_menu = function() {
    var self = this;
    var items = [];
    items.push(['Set range...', function() {self.set_range();}]);

    if (this.show_legend) {
        items.push(['Hide legend', function() {self.set_show_legend(false);}]);
    } else {
        items.push(['Show legend', function() {self.set_show_legend(true);}]);
    }

    // add the parent's menu items to this
    return $.merge(items, Nengo.Component.prototype.generate_menu.call(this));
};

Nengo.Value.prototype.set_show_legend = function(value){
    if (this.show_legend !== value) {
        this.show_legend = value;
        this.save_layout();
    }
    if (this.show_legend === true){
        Nengo.draw_legend(this.legend, this.legend_labels, this.color_func);
    } else {
        // delete the legend's children
        while(this.legend.lastChild){
            this.legend.removeChild(this.legend.lastChild);
        }
    }
}

Nengo.Value.prototype.layout_info = function () {
    var info = Nengo.Component.prototype.layout_info.call(this);
    info.show_legend = this.show_legend;
    info.legend_labels = this.legend_labels;
    info.min_value = this.axes2d.scale_y.domain()[0];
    info.max_value = this.axes2d.scale_y.domain()[1];
    return info;
}

Nengo.Value.prototype.update_layout = function(config) {
    this.update_range(config.min_value, config.max_value);
    Nengo.Component.prototype.update_layout.call(this, config);
}

Nengo.Value.prototype.set_range = function() {
    var range = this.axes2d.scale_y.domain();
    var self = this;
    Nengo.modal.title('Set graph range...');
    Nengo.modal.single_input_body(range, 'New range');
    Nengo.modal.footer('ok_cancel', function(e) {
        var new_range = $('#singleInput').val();
        var modal = $('#myModalForm').data('bs.validator');
        modal.validate();
        if (modal.hasErrors() || modal.isIncomplete()) {
            return;
        }
        if (new_range !== null) {
            new_range = new_range.split(',');
            var min = parseFloat(new_range[0]);
            var max = parseFloat(new_range[1]);
            self.update_range(min, max);
            self.save_layout();
            self.axes2d.axis_y.tickValues([min, max])
            self.axes2d.fit_ticks(self);
        }
        $('#OK').attr('data-dismiss', 'modal');
    });
    var $form = $('#myModalForm').validator({
        custom: {
            my_validator: function($item) {
                var nums = $item.val().split(',');
                var valid = false;
                if ($.isNumeric(nums[0]) && $.isNumeric(nums[1])) {
                    if (Number(nums[0]) < Number(nums[1])) {
                        valid = true; //Two numbers, 1st less than 2nd
                    }
                }
                return (nums.length==2 && valid);
            }
        },
    });

    $('#singleInput').attr('data-error', 'Input should be in the ' +
                           'form "<min>,<max>".');
    Nengo.modal.show();
    $('#OK').on('click', function () {
        var w = $(self.div).width();
        var h = $(self.div).height();
        self.on_resize(w, h);
    })
}

Nengo.Value.prototype.update_range = function(min, max) {
    this.axes2d.scale_y.domain([min, max]);
    this.axes2d.axis_y_g.call(this.axes2d.axis_y);
}

Nengo.Value.prototype.reset = function(event) {
    this.data_store.reset();
    this.schedule_update();
}
