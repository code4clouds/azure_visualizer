// Vue.use(VeeValidate);
Vue.component('v-select', VueSelect.VueSelect);

new Vue({
  el: "#app",
  data: {
    message: "Azure Visualizer!",
    tenant_id: "",
    subscription_id: "",
    client_id: "",
    client_secret: "",
    token: "",
    isLoginVisible: true,
    isLoading: false,
    subscriptions: [],
    rg_filter: [],
    rg_filter_selected: [],
    sys: null,
  },
  methods: {
    getToken: function () {
      console.log("Login to get token...");
      var body = {
        tenant_id: this.tenant_id,
        client_id: this.client_id,
        client_secret: this.client_secret
      };

      this.$http
        .post("/login", body)
        .then(
          response => {
            this.token = response.body["access_token"];
            console.log("token: " + this.token);
            this.isLoginVisible = false;
          },
          response => {
            console.log("error posting...");
          }
        )
        .then(() => {
          console.log("login.then...");
          // this.getSubscription();
          this.loadResourceView();
        });
    },
    filterChanged(val) {
      this.rg_filter_selected = val;
      this.getToken();
      if(this.sys != null) {
        this.sys.stop();
      }
    },
    loadResourceView: function () {
      this.message = "Loading Resources...";
      var body = "/resourcegroups?api-version=2017-05-10";
      this.$http
        .post("/azureresources", body, {
          headers: {
            token: this.token,
            subscription: this.subscription_id
          }
        })
        .then(
          response => {
            this.az_resources = response.body.value;
            console.log("azureresources: " + response);
          },
          response => {
            console.log("error posting...");
          }
        )
        .then(() => {
          this.render(
            this.az_resources.map(connection => {
              return {
                name: connection.name,
                url: connection.id
              };
            })
          );
        });
    },
    loadResourceItems: function (resource_group) {
      this.message = "Loading Resource Items...";
      const body = resource_group.url + '/resources';
      return this.$http
        .post("/azureroute", body, {
          headers: {
            token: this.token,
          }
        })
        .then(
          response => {
            const az_resourcesItems = response.body.value;
            // console.log("azure route: " + response.body.value[0].name);
            return az_resourcesItems.map(item => {
              // Create filter selection
              if (this.rg_filter.indexOf(item.type) === -1) {
                this.rg_filter.push(item.type);
              }
              return {
                name: item.name,
                url: item.id,
                type: item.type,
                parent: resource_group.name,
              };
            }).filter(item => {
              // console.log('filtered: ' + this.rg_filter_selected);
              // Filter based on the selection
              return this.rg_filter_selected.indexOf(item.type)>=0;
            })
          },
          response => {
            console.log("error posting...");
          }
        );
    },
    logout: function () {
      this.message = "Logging Out...";
      tenant_id = "";
      client_id = "";
      client_secret = "";
    },
    render: function (connections) {
      var sys = arbor.ParticleSystem(1000, 600, 0.5); // create the system with sensible repulsion/stiffness/friction
      this.sys = sys;
      sys.parameters({
        gravity: true
      }); // use center-gravity to make the graph settle nicely (ymmv)
      sys.renderer = this.Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...

      var ui = {
        nodes: {
          Azure: {
            color: "#00abec",
            shape: "dot",
            alpha: 1
          }
        },
        edges: {
          Azure: {}
        }
      };

      this.message = "Creating Azure Connections...";
      for (connection of connections) {
        ui["nodes"][connection.name] = {
          color: "black",
          shape: "dot",
          alpha: 1,
          link: '#reference'
        };
        ui["edges"]["Azure"][connection.name] = {
          length: 0.6
        };
        ui["edges"][connection.name] = {};
        console.log(connection + " added...");
      }
      sys.graft(ui);

      var colorHash = new ColorHash();
      for (f_connection of connections) {
        this.loadResourceItems(f_connection)
          .then((rgItems) => {
            for (rgItem of rgItems) {
              sys.addNode(rgItem.name + " ", {
                color: colorHash.hex(rgItem.type),
                shape: "dot",
                alpha: 1,
                link: '#reference'
              });
              sys.addEdge(rgItem.parent, rgItem.name + " ");
              console.log(rgItem.parent, rgItem.name + " ");
            }
          });
        console.log(connection + " added...");
      }

      this.message = "Render Completed...";
    },
    Renderer: function (elt) {
      var dom = $(elt);
      var canvas = dom.get(0);
      var ctx = canvas.getContext("2d");
      var gfx = arbor.Graphics(canvas);
      var sys = null;

      var _vignette = null;
      var selected = null,
        nearest = null,
        _mouseP = null;

      var that = {
        init: function (pSystem) {
          sys = pSystem;
          sys.screen({
            size: {
              width: dom.width(),
              height: dom.height()
            },
            padding: [36, 60, 36, 60]
          });

          $(window).resize(that.resize);
          that.resize();
          that._initMouseHandling();

          if (document.referrer.match(/echolalia|atlas|halfviz/)) {
            // if we got here by hitting the back button in one of the demos,
            // start with the demos section pre-selected
            that.switchSection("demos");
          }
        },
        resize: function () {
          canvas.width = $(window).width();
          canvas.height = 0.75 * $(window).height();
          sys.screen({
            size: {
              width: canvas.width,
              height: canvas.height
            }
          });
          _vignette = null;
          that.redraw();
        },
        redraw: function () {
          gfx.clear();
          sys.eachEdge(function (edge, p1, p2) {
            if (edge.source.data.alpha * edge.target.data.alpha == 0) return;
            gfx.line(p1, p2, {
              stroke: "#b2b19d",
              width: 2,
              alpha: edge.target.data.alpha
            });
          });
          sys.eachNode(function (node, pt) {
            var w = Math.max(20, 20 + gfx.textWidth(node.name));
            if (node.data.alpha === 0) return;
            if (node.data.shape == "dot") {
              gfx.oval(pt.x - w / 2, pt.y - w / 2, w, w, {
                fill: node.data.color,
                alpha: node.data.alpha
              });
              gfx.text(node.name, pt.x, pt.y + 7, {
                color: "white",
                align: "center",
                font: "Arial",
                size: 12
              });
              gfx.text(node.name, pt.x, pt.y + 7, {
                color: "white",
                align: "center",
                font: "Arial",
                size: 12
              });
            } else {
              gfx.rect(pt.x - w / 2, pt.y - 8, w, 20, 4, {
                fill: node.data.color,
                alpha: node.data.alpha
              });
              gfx.text(node.name, pt.x, pt.y + 9, {
                color: "white",
                align: "center",
                font: "Arial",
                size: 12
              });
              gfx.text(node.name, pt.x, pt.y + 9, {
                color: "white",
                align: "center",
                font: "Arial",
                size: 12
              });
            }
          });
          that._drawVignette();
        },

        _drawVignette: function () {
          var w = canvas.width;
          var h = canvas.height;
          var r = 20;

          if (!_vignette) {
            var top = ctx.createLinearGradient(0, 0, 0, r);
            top.addColorStop(0, "#e0e0e0");
            top.addColorStop(0.7, "rgba(255,255,255,0)");

            var bot = ctx.createLinearGradient(0, h - r, 0, h);
            bot.addColorStop(0, "rgba(255,255,255,0)");
            bot.addColorStop(1, "white");

            _vignette = {
              top: top,
              bot: bot
            };
          }

          // top
          ctx.fillStyle = _vignette.top;
          ctx.fillRect(0, 0, w, r);

          // bot
          ctx.fillStyle = _vignette.bot;
          ctx.fillRect(0, h - r, w, r);
        },

        switchMode: function (e) {
          if (e.mode == "hidden") {
            dom.stop(true).fadeTo(e.dt, 0, function () {
              if (sys) sys.stop();
              $(this).hide();
            });
          } else if (e.mode == "visible") {
            dom
              .stop(true)
              .css("opacity", 0)
              .show()
              .fadeTo(e.dt, 1, function () {
                that.resize();
              });
            if (sys) sys.start();
          }
        },

        switchSection: function (newSection) {
          var parent = sys.getEdgesFrom(newSection)[0].source;
          var children = $.map(sys.getEdgesFrom(newSection), function (edge) {
            return edge.target;
          });

          sys.eachNode(function (node) {
            if (node.data.shape == "dot") return; // skip all but leafnodes

            var nowVisible = $.inArray(node, children) >= 0;
            var newAlpha = nowVisible ? 1 : 0;
            var dt = nowVisible ? 0.5 : 0.5;
            sys.tweenNode(node, dt, {
              alpha: newAlpha
            });

            if (newAlpha == 1) {
              node.p.x = parent.p.x + 0.05 * Math.random() - 0.025;
              node.p.y = parent.p.y + 0.05 * Math.random() - 0.025;
              node.tempMass = 0.001;
            }
          });
        },

        _initMouseHandling: function () {
          // no-nonsense drag and drop (thanks springy.js)
          selected = null;
          nearest = null;
          var dragged = null;
          var oldmass = 1;

          var _section = null;

          var handler = {
            moved: function (e) {
              var pos = $(canvas).offset();
              _mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);
              nearest = sys.nearest(_mouseP);

              if (!nearest.node) return false;

              if (nearest.node.data.shape != "dot") {
                selected = nearest.distance < 50 ? nearest : null;
                if (selected) {
                  dom.addClass("linkable");
                  window.status = selected.node.data.link
                    .replace(/^\//, "http://" + window.location.host + "/")
                    .replace(/^#/, "");
                } else {
                  dom.removeClass("linkable");
                  window.status = "";
                }
              } else if (
                $.inArray(nearest.node.name, [
                  "arbor.js",
                  "code",
                  "docs",
                  "demos"
                ]) >= 0
              ) {
                if (nearest.node.name != _section) {
                  _section = nearest.node.name;
                  that.switchSection(_section);
                }
                dom.removeClass("linkable");
                window.status = "";
              }

              return false;
            },
            clicked: function (e) {
              var pos = $(canvas).offset();
              _mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);
              nearest = dragged = sys.nearest(_mouseP);

              if (nearest && selected && nearest.node === selected.node) {
                var link = selected.node.data.link;
                if (link.match(/^#/)) {
                  $(that).trigger({
                    type: "navigate",
                    path: link.substr(1)
                  });
                } else {
                  window.location = link;
                }
                return false;
              }

              if (dragged && dragged.node !== null) dragged.node.fixed = true;

              $(canvas).unbind("mousemove", handler.moved);
              $(canvas).bind("mousemove", handler.dragged);
              $(window).bind("mouseup", handler.dropped);

              return false;
            },
            dragged: function (e) {
              var old_nearest = nearest && nearest.node._id;
              var pos = $(canvas).offset();
              var s = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);

              if (!nearest) return;
              if (dragged !== null && dragged.node !== null) {
                var p = sys.fromScreen(s);
                dragged.node.p = p;
              }

              return false;
            },

            dropped: function (e) {
              if (dragged === null || dragged.node === undefined) return;
              if (dragged.node !== null) dragged.node.fixed = false;
              dragged.node.tempMass = 1000;
              dragged = null;
              // selected = null
              $(canvas).unbind("mousemove", handler.dragged);
              $(window).unbind("mouseup", handler.dropped);
              $(canvas).bind("mousemove", handler.moved);
              _mouseP = null;
              return false;
            }
          };

          $(canvas).mousedown(handler.clicked);
          $(canvas).mousemove(handler.moved);
        }
      };

      return that;
    },

    created: function () {
      this.$nextTick(() => {
        this.message = "Verifying Remote Server Configuration...";
        fetch("/serverlogin")
          .then(res => {
            if (res.status == 200) {
              // Server configured
              this.isLoginVisible = false;
              this.getToken();
            }
          })
          .catch((this.isLoginVisible = true)); //Not configured
      });
    }
  }
});