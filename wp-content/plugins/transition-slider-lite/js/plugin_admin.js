"use strict";
(function($) {
    $(document).ready(function() {
        var $loader = $(".STX-loader-container").hide();
        $(".wrap").show();

        var json_str = options.replace(/&quot;/g, '"');
        var content = $(".STX-saved-notification-content");
        var btnDeleteAll = $(".STX-slider-trash-btn-large");
        var msgSuccess = "Slider saved.";
        var msgNoSlides = "Slider has no slides!";
        var msgError = "Error saving slider. Please refresh the page!";
        var msgDeletedSlides = "All slides deleted.";
        var counterForSlides = 0,
            slidesWrapper,
            slider,
            slide,
            url,
            file,
            title,
            btns_disabled,
            $form,
            o,
            responseSuccess,
            currentSlide = -1,
            currentElement = -1,
            currentSlideType,
            layerClipboard = [],
            selectedElements = [],
            animateCSSName,
            previewSlilderInstance;

        $(".slide-settings-tabs-wrapper").tabs();
        $(".element-settings-tabs-wrapper").tabs();
        $(".style-font-wrapper").tabs();

        $(".accordion").accordion({
            heightStyle: "content",
            animate: false,
            collapsible: true,
            icons: false
        });

        options = jQuery.parseJSON(json_str);

        function showLoader() {
            $loader.show();
        }

        function hideLoader() {
            $loader.hide();
        }

        function convertStrings(obj) {
            $.each(obj, function(key, value) {
                if (typeof value == "object" || typeof value == "array") {
                    convertStrings(value);
                } else if (!isNaN(value)) {
                    if (obj[key] === "") delete obj[key];
                    else if (typeof obj[key] != "boolean") obj[key] = Number(value);
                } else if (value === "true") {
                    obj[key] = true;
                } else if (value === "false") {
                    obj[key] = false;
                }
            });
        }

        convertStrings(options);

        options.slides &&
            options.slides.forEach(function(slide) {
                if (slide.layerWidth && !options.layerWidth) options.layerWidth = slide.layerWidth;
                if (slide.layerHeight && !options.layerHeight) options.layerHeight = slide.layerHeight;
            });

        options.layerWidth = options.layerWidth || "100%";
        options.layerHeight = options.layerHeight || "100%";
        options.shadow = options.shadow || "off";

        $form = $("#slider-options-form");

        $form.submit(function(e) {
            e.preventDefault();

            if (btns_disabled) return;
            enableButtons();

            var o = JSON.parse(JSON.stringify(options));
            o.slides.forEach(function(slide) {
                if (slide.elements)
                    slide.elements.forEach(function(element) {
                        delete element.$node;
                        delete element.node;
                        delete element.id;
                        delete element.index;
                    });
            });

            function deleteEmptyStrings(obj) {
                for (var key in obj) {
                    if (typeof obj[key] === "object") {
                        if((obj[key] === null) || (obj[key].length === 0)) delete obj[key];
                        else obj[key] = deleteEmptyStrings(obj[key]);
                    }
                    else if (obj[key] === "") delete obj[key];
                }
                return obj;
            }

            o = deleteEmptyStrings(o);

            var slider = JSON.stringify(o);

            showLoader();

            $.ajax({
                type: "POST",
                url: $form.attr("action"),
                data: {
                    id: options.id,
                    status: options.status,
                    slider: slider,
                    security: window.stx_nonce,
                    action: "transitionslider_save"
                },
                success: function(data, textStatus, jqXHR) {
                    changeSliderHeader($("input[name=instanceName]").val());
                    showNotification("success", msgSuccess);
                    responseSuccess = true;
                    hideLoader();
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    showNotification("error", msgError);
                    hideLoader();
                }
            });
        });

        $(".STX-footer-layer-btn").click(function() {
            toggleLayerListPopup();
        });

        $(".slider-preview").click(function(e) {
            $("#preview-slider-modal").show();

            $("body").css("overflow", "hidden");

            enableButtons();

            options.slides[0].layerWidth = options.slides[0].layerWidth || 1000;
            options.slides[0].layerHeight = options.slides[0].layerHeight || 1000;

            var o = options || {};
            if (o.navigation && !o.navigation.enable) o.navigation = false;
            if (o.wheelNavigation && !o.wheelNavigation.enable) o.wheelNavigation = false;
            if (o.pagination && !o.pagination.enable) o.pagination = false;
            if (o.keyboard && !o.keyboard.enable) o.keyboard = false;
            if (o.autoplay && !o.autoplay.enable) o.autoplay = false;
            if (o.shadow && o.shadow == "off") o.shadow = null;
            o.initialSlide = 0;
            o.hashNavigation = false;

            for (var key in o.slides) {
                if (o.slides[key].elements) {
                    for (var key2 in o.slides[key].elements) {
                        delete o.slides[key].elements[key2].node;
                    }
                }
                o.slides[key].urlTarget = o.slides[key].urlTarget == true || o.slides[key].urlTarget == "_blank" ? "_blank" : "_self";
            }

            $("#slider-preview-container")
                .empty()
                .append('<div class="sp">');

            previewSlilderInstance = $(".sp").transitionSlider(o);
        });

        changeSliderHeader(options.instanceName);

        function changeSliderHeader(heading) {
            if (options) options.instanceName ? (title = 'Edit "' + heading + '"') : (title = "Add New Slider");
            $(".edit-slider-text").text(title);
        }

        $(".btn-slider-name").text("Settings");

        function setDefaultValue(name, value) {
            options[name] = options[name] || value;
        }

        addOption("publish", "", "publishArea");

        addOption("general-settings", "instanceName", "text", "Slider name", "", "");
        addOption("general-settings", "initialSlide", "text", "Initial slide", "0", "");
        addOption("general-settings", "shadow", "dropdown", "Slider shadow", "off", ["effect1", "effect2", "effect3", "effect4", "effect5", "effect6", "off"], "");
        addOption("general-settings", "grabCursor", "checkbox", "Grab cursor", true, "", "", "");
        addOption("general-settings", "stopOnLastSlide", "checkbox", "Stop on last slide", false, "", "");
        addOption("general-settings", "overlay", "color", "Overlay color (between layer and background)", "", "", "");
        addOption("general-settings", "parallax", "text", "Parallax factor (between 0 and 1)", "", "", "");
        addOption("general-settings", "invertColorSelectors", "text", "CSS selector for Menu (used to change menu colors on slide change)", "", "", "");

        addOption("size", "responsive", "checkbox", "Responsive mode", true, "", "hasSubitem");
        addOption("size", "ratio", "text", "Responsive ratio (width / height)", "2", "", "isSubitem");
        addOption("size", "fullscreen", "checkbox", "Fullscreen mode", false, "", "hasSubitem");
        addOption("size", "sliderSize", "textOnly", "Fixed mode", "", "", "hasSubitem", "");
        addOption("size", "width", "textWithUnit", "Width", "1000", "px", "isSubitem", "");
        addOption("size", "height", "textWithUnit", "Height", "550", "px", "isSubitem", "");
        addOption("layer", "layerBackground", "color", "Background Color", "", "", "");

        addOption("layer", "sliderSize", "textOnly", "Desktop", "", "", "hasSubitem", "");
        addOption("layer", "layerWidth", "textWithUnit", "Width", "", "px or %", "isSubitem", "");
        addOption("layer", "layerWidthMin", "textWithUnit", "Min Width", "", "px or %", "isSubitem", "");
        addOption("layer", "layerWidthMax", "textWithUnit", "Max Width", "", "px or %", "isSubitem", "");
        addOption("layer", "layerHeight", "textWithUnit", "Height", "", "px or %", "isSubitem", "");
        addOption("layer", "layerHeightMin", "textWithUnit", "Min Height", "", "px or %", "isSubitem", "");
        addOption("layer", "layerHeightMax", "textWithUnit", "Max Height", "", "px or %", "isSubitem", "");
        addOption("autoplay", "autoplay.enable", "checkbox", "Enable", false, "", "");
        addOption("autoplay", "autoplay.delay", "textWithUnit", "Delay between transitions", 3000, "ms", "");
        addOption("autoplay", "autoplay.disableOnInteraction", "checkbox", "Disable on user interaction", true, "", "");
        addOption("autoplay", "autoplay.reverseDirection", "checkbox", "Reverse direction", false, "");

        addOption("buttons", "buttons.pauseVisible", "checkbox", "Pause button", false, "", "", "");
        addOption("buttons", "buttons.muteVisible", "checkbox", "Mute button", false, "", "", "");

        addOption("arrows", "navigation", "textOnly", "Arrows", "", "", "hasSubitem", "");
        addOption("arrows", "navigation.enable", "checkbox", "Enable", true, "", "isSubitem", "");
        addOption("arrows", "navigation.style", "radio", "Style", "effect4", ["effect1", "effect2", "effect3", "effect4", "effect5", "effect6", "effect7", "effect8", "effect9", "effect10"], "isSubitem", "hasPreview");
        addOption("arrows", "navigation", "textOnly", "Style", "", "", "hasSubitem", "");
        addOption("arrows", "navigation.color", "color", "Color", "", "", "isSubitem", "");
        addOption("arrows", "navigation.backgroundColor", "color", "Background", "", "", "isSubitem", "");
        addOption("arrows", "navigation.borderRadius", "textWithUnit", "Border radius", "", "CSS value", "isSubitem", "");
        addOption("arrows", "navigation.boxShadow", "textWithUnit", "Box shadow", "", "CSS value", "isSubitem", "");
        addOption("arrows", "navigation.backgroundSize", "textWithUnit", "Background size", "", "CSS value", "isSubitem", "");

        addOption("arrows", "navigation", "textOnly", "Style hover", "", "", "hasSubitem", "");
        addOption("arrows", "navigation.backgroundColorHover", "color", "Background", "", "", "isSubitem", "");
        addOption("arrows", "navigation.borderRadiusHover", "textWithUnit", "Border radius", "", "CSS value", "isSubitem", "");
        addOption("arrows", "navigation.boxShadowHover", "textWithUnit", "Box shadow", "", "CSS value", "isSubitem", "");
        addOption("arrows", "navigation.backgroundSizeHover", "textWithUnit", "Background size", "", "CSS value", "isSubitem", "");

        addOption("arrows", "keyboard", "textOnly", "Keyboard", "", "", "hasSubitem", "");
        addOption("arrows", "keyboard.enable", "checkbox", "Enable", true, "", "isSubitem", "");

        addOption("wheel-navigation", "wheelNavigation.enable", "checkbox", "Enable", false, "", "");
        addOption("wheel-navigation", "wheelNavigation.stopOnLast", "checkbox", "Stop on last slide", false, "");

        addOption("pagination", "pagination.enable", "checkbox", "Pagination", true, "", "hasSubitem", "");
        addOption("pagination", "pagination.style", "radio", "Style", "effect2", ["effect1", "effect2", "effect3", "effect4", "effect5", "effect6"], "isSubitem", "");

        addOption("pagination", "pagination.clickable", "checkbox", "Clickable", true, "", "isSubitem", "");
        addOption("pagination", "pagination.dynamicBullets", "checkbox", "Dynamic", false, "", "isSubitem", "");

        addOption("pagination", "pagination", "textOnly", "Style", "", "", "hasSubitem", "");
        addOption("pagination", "pagination.backgroundColor", "color", "Background", "", "", "isSubitem", "");
        addOption("pagination", "pagination.borderRadius", "textWithUnit", "Border radius", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.boxShadow", "textWithUnit", "Box shadow", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.opacity", "textWithUnit", "Opacity", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.width", "textWithUnit", "Width", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.height", "textWithUnit", "Height", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.border", "textWithUnit", "Border", "", "CSS value", "isSubitem", "");

        addOption("pagination", "pagination", "textOnly", "Style active", "", "", "hasSubitem", "");
        addOption("pagination", "pagination.backgroundColorActive", "color", "Background", "", "", "isSubitem", "");
        addOption("pagination", "pagination.borderRadiusActive", "textWithUnit", "Border radius", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.boxShadowActive", "textWithUnit", "Box shadow", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.opacityActive", "textWithUnit", "Opacity", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.widthActive", "textWithUnit", "Width", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.heightActive", "textWithUnit", "Height", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.borderActive", "textWithUnit", "Border", "", "CSS value", "isSubitem", "");

        addOption("pagination", "pagination", "textOnly", "Style hover", "", "", "hasSubitem", "");
        addOption("pagination", "pagination.backgroundColorHover", "color", "Background", "", "", "isSubitem", "");
        addOption("pagination", "pagination.borderRadiusHover", "textWithUnit", "Border radius", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.boxShadowHover", "textWithUnit", "Box shadow", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.opacityHover", "textWithUnit", "Opacity", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.widthHover", "textWithUnit", "Width", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.heightHover", "textWithUnit", "Height", "", "CSS value", "isSubitem", "");
        addOption("pagination", "pagination.borderHover", "textWithUnit", "Border", "", "CSS value", "isSubitem", "");

        addOption("hash-navigation", "hashNavigation.enable", "checkbox", "Enable", false, "", "", "");

        addOption("loading", "loading.fadeEffect", "checkbox", "Fade in/out effect", true, "", "", "");
        addOption("loading", "loading.backgroundColor", "color", "Background color", "#ffffff", "", "");
        addOption("loading", "loading.color", "color", "Color", "#262626", "", "");
        addOption("loading", "loading.style", "radio", "Style", "style2", ["style1", "style2", "style3", "style4"], "", "hasPreview");

        addOption("lightbox", "lightbox.backgroundColor", "color", "Background color", "rgba(0, 0, 0, 0.95)", "", "");
        addOption("lightbox", "lightbox.closeColor", "color", "Close button color", "#ffffff", "", "");

        function addOption(section, name, type, desc, defaultValue, values, subItemType, hasPreview) {
            var table = $("#slider-options-" + section + "");
            var tableBody = table.find("tbody");
            var row = $('<tr valign="top"  class="field-row"></tr>').appendTo(tableBody);
            var th = $('<th scope="row" class="STX-th-label">' + desc + "</th>").appendTo(row);
            var name1 = name.split(".")[0];
            var name2 = name.split(".")[1];
            var val;

            if (subItemType) $(th).addClass(subItemType);

            if (name2 && options.hasOwnProperty(name1) && options[name1].hasOwnProperty(name2)) val = options[name1][name2];
            else if (!name2 && options.hasOwnProperty(name1)) val = options[name1];
            else {
                val = defaultValue;
                if (name2) {
                    options[name1] = options[name1] || {};
                    options[name1][name2] = val;
                } else options[name1] = val;
            }

            switch (type) {
                case "text":
                    var td = $('<td class="STX-element"><div class="STX-form-element-text STX-element-num  STX-text-has-unit  STX-input-border-radius"></div></td>').appendTo(row);
                    var input = $('<input class="inputField" type="text" name="' + name + '"/>').appendTo(td.children());
                    input.attr("value", val);
                    break;

                case "textWithUnit":
                    var td = $('<td class="STX-element"><div class="STX-form-element-text STX-element-num  STX-text-has-unit  STX-input-border-radius"></div></td>').appendTo(row);
                    var input = $('<input class="inputField" type="text" name="' + name + '"/><div class="STX-text-unit STX-unit-font">' + values + "</div>").appendTo(td.children());
                    input.attr("value", val);
                    break;

                case "textOnly":
                    var td = $('<td class="STX-element"></div></td>').appendTo(row);
                    break;

                case "color":
                    var td = $('<td class="STX-td-element"></td>').appendTo(row);
                    var input = $('<input class="STX-input" type="text" data-alpha="true" name="' + name + '"/>').appendTo(td);
                    input.attr("value", val);
                    input.wpColorPicker();
                    break;

                case "textarea":
                    var td = $('<td class="STX-td-element"></td>').appendTo(row);
                    var textarea = $('<textarea class="STX-input" type="text" name="' + name + '" cols=45" rows="1"></textarea>').appendTo(td);
                    textarea.attr("value", val);
                    break;

                case "checkbox":
                    var td = $('<td class="STX-td-element"></td>').appendTo(row);
                    var inputHidden = $('<input class="STX-input" type="hidden" name="' + name + '" value="false"/>').appendTo(td);
                    var input = $('<div class="STX-onoffswitch"><input type="checkbox" name="' + name + '" value="true" class="STX-onoffswitch-checkbox" id="' + name + '"><label class="STX-onoffswitch-label" for="' + name + '"><span class="STX-onoffswitch-inner"></span><span class="STX-onoffswitch-switch"></span></label></div>').appendTo(td);
                    input.attr("value", val);
                    input.find("input").prop("checked", val);

                    break;

                case "dropdown":
                    var td = $('<td class="STX-td-element"></td>').appendTo(row);

                    var dropdown = $('<div class="dropdown STX-edit-dropdown btns-dashboard-nav"><div class="select"><span></span><i aria-hidden="true" class="fa fa-chevron-down"></i><input type="hidden" name="' + name + '"></div></div>').appendTo(td);
                    var ul = $('<ul class="dropdown-menu STX-edit-dropdown-menu"></ul>').appendTo(dropdown);

                    for (var i = 0; i < values.length; i++) {
                        var li = $("<li>" + values[i] + "</li>")
                            .appendTo(ul)
                            .click(function() {
                                dropdown.find("span").text($(this).text());
                                dropdown
                                    .find("input")
                                    .val($(this).text())
                                    .trigger("change");
                            });
                    }

                    dropdown.find("span").text(val);
                    dropdown.find("input").attr("value", val);

                    break;

                case "radio":
                    var td = $('<td class="STX-td-element"></td>').appendTo(row);
                    td.addClass(name1 + "-" + name2);

                    var inputHidden = $('<input class="STX-input" type="hidden" name="' + name + '" value="' + val + '"/>').appendTo(td);

                    for (var i = 0; i < values.length; i++) {
                        var $item = $('<div id="' + values[i] + '" class="item"><div class="inner ' + values[i] + '"></div></div>');

                        td.append($item);

                        if (values[i] == val) $item.addClass("selected");

                        $item.click(function() {
                            td.find(".selected").removeClass("selected");
                            $(this).addClass("selected");
                            inputHidden.attr("value", this.id).trigger("change");
                        });
                    }
                    break;

                case "publishArea":
                    var publish = $(".STX-publish-table-wrap");
                    tableBody.empty();
                    $(
                        '<div class="STX-publish-content">' +
                            '<div class="STX-publish-title STX-admin">Shortcode</div>' +
                            '<div class="STX-publish-text STX-admin">Copy and paste this shortcode into your posts or pages:</div>' +
                            '<div class="STX-STX-publish-shortcode">' +
                            '<div class="STX-publish-table">' +
                            '<p class="STX-shortcode-left">[transitionslider id="' +
                            options.id +
                            '"]</p>' +
                            '<div id="' +
                            options.id +
                            '" title="Copy shortcode" id="1" class="STX-shortcode-right STX-btn-copy-shortcode">COPY</div>' +
                            "</div>" +
                            "</div>" +
                            "</div>"
                    ).appendTo(tableBody);
                    break;
            }
        }

        $(".STX-edit-dropdown").click(function() {
            $(this)
                .attr("tabindex", 1)
                .focus();
            $(this).toggleClass("active");
            $(this)
                .find(".STX-edit-dropdown-menu")
                .slideToggle(300);
        });
        $(".STX-edit-dropdown").focusout(function() {
            $(this).removeClass("active");
            $(this)
                .find(".STX-edit-dropdown-menu")
                .slideUp(300);
        });
        $(".STX-edit-dropdown .STX-edit-dropdown-menu li").click(function() {
            $(this)
                .parents(".dropdown")
                .find("span")
                .text($(this).text());
            $(this)
                .parents(".dropdown")
                .find("input")
                .attr("value", $(this).text());
            $(this)
                .parents(".dropdown")
                .find("input")
                .attr("selected", "true");
        });
        $(".STX-edit-dropdown-menu li").click(function() {
            var getVal = $(this)
                .parents(".STX-edit-dropdown")
                .find("input")
                .val();
        });

        $('select[name="contentAnimationType"]').on("change keyup", function() {
            updateContentAnimationType($(this).val());
        });

        $("body").click(function(e) {
            var target = $(e.target);
            var formElementText = $(".STX-form-element-text");

            if (target.hasClass("inputField")) {
                if (formElementText.hasClass("focus")) formElementText.removeClass("focus");

                target.parent().addClass("focus");
                $(".STX-text-has-unit")
                    .find("STX-text-unit")
                    .addClass("focus");
                target.addClass("focus");
            } else {
                if (formElementText.hasClass("focus")) formElementText.removeClass("focus");
            }
        });
        if (options.slides) {
            enableButtons();

            for (var i = 0; i < options.slides.length; i++) {
                slide = options.slides[i];
                slidesWrapper = $("#STX-images-wrapper");

                createSlidesHtml(i, slide.src);
            }
            counterForSlides = $(".slide-item").length;
        } else {
            btns_disabled = true;
        }

        function onSlideReorder() {
            var newSlides = [];
            var arr = $(".slide-item").each(function(key, val) {
                newSlides[key] = options.slides[Number(val.id)];
            });

            arr.each(function(key, val) {
                val.id = key;
            });

            options.slides = newSlides;
        }

        function makeSortable() {
            $(".tabs").tabs();

            $(".ui-sortable").sortable({
                opacity: 0.6,
                stop: function(event, ui) {
                    onSlideReorder();
                },
                start: function(event, ui) {}
            });
        }

        function updateContentAnimationType(val) {
            $(".content-animation-type").hide();
            $("." + val).show();
        }


        $(".googleFontList").append('<option value="initial">Default</option>');

        $.getJSON("https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBmNd8k2DDxBqmU2d4B9AbPDSHfR12DJ6c", function(response) {
            for (var key in response.items) {
                $(".googleFontList").append('<option value="' + response.items[key].family + '" style="font-family: ' + response.items[key].family + '; font-weight: 400" class="">' + response.items[key].family + "</option>");
            }
        });

        var $editSlideModal = $("#edit-slide-modal");
        var $editSlideModalBackdrop = $(".media-modal-backdrop");

        $(".cp").wpColorPicker();

        var $prev = $(".edit-media-header").find(".STX-button-modal-previous");
        var $next = $(".edit-media-header").find(".STX-button-modal-next");

        $next.click(function() {
            showNextSlide();
        });

        $prev.click(function() {
            showPrevSlide();
        });

        var $slider = $(".slider-preview-area").css("minWidth", "1024px");

        resizeLayers();

        var deviceType, oldDeviceType;

        function showPrevSlide() {
            currentSlide += options.slides.length - 1;
            currentSlide = currentSlide % options.slides.length;
            showSlide(currentSlide);
        }

        function showNextSlide() {
            currentSlide++;
            currentSlide = currentSlide % options.slides.length;
            showSlide(currentSlide);
        }

        $(".slider-options-wrappper input").change(function() {
            if (this.name) {
                var arr = this.name.split(".");
                var val = this.type == "checkbox" ? this.checked : this.value;
                if (arr.length == 2) {
                    if (typeof options[arr[0]] != "object") options[arr[0]] = {};
                    options[arr[0]][arr[1]] = val;
                } else options[this.name] = val;
            }
        });

        $(".slider-options-wrappper select").change(function() {
            if (this.name) {
                var arr = this.name.split(".");
                if (arr.length == 2) {
                    if (typeof options[arr[0]] != "object") options[arr[0]] = {};
                    options[arr[0]][arr[1]] = this.value;
                } else options[this.name] = this.value;
            }
        });

        $("#tabs-slide")
            .find("input")
            .change(function() {
                if (this.name) {
                    var arr = this.name.split(".");
                    var val = this.type == "checkbox" ? this.checked : this.value;
                    if (arr.length == 2) {
                        if (typeof options.slides[currentSlide][arr[0]] != "object") options.slides[currentSlide][arr[0]] = {};
                        options.slides[currentSlide][arr[0]][arr[1]] = val;
                    } else options.slides[currentSlide][this.name] = val;
                }
            });

        $("#tabs-slide")
            .find("select")
            .change(function() {
                if (this.name) {
                    var arr = this.name.split(".");
                    if (arr.length == 2) {
                        if (typeof options.slides[currentSlide][arr[0]] != "object") options.slides[currentSlide][arr[0]] = {};
                        options.slides[currentSlide][arr[0]][arr[1]] = this.value;
                    } else options.slides[currentSlide][this.name] = this.value;
                }
            });

        function resetTextarea() {
            $(".element-settings textarea").val("");
        }

        var transitionOptions = {
            slide: {
                direction: [{ name: "Left", value: "left" }],
                easing: [{ name: "Default", value: "" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            },

            roll: {
                direction: [{ name: "Left", value: "left" }, { name: "Right", value: "right" }, { name: "Top", value: "top" }, { name: "Bottom", value: "bottom" }, { name: "Top left", value: "topleft" }, { name: "Top right", value: "topRight" }, { name: "Bottom left", value: "bottomlreft" }, { name: "Bottom right", value: "bottomRight" }, { name: "Random", value: "" }],
                easing: [{ name: "Default", value: "" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            },

            crossfade: {
                direction: [
                    { name: "In", value: "in" },
                    { name: "Out", value: "out" },
                    ]
            },

            stretch: {
                direction: [{ name: "Left", value: "left" }, { name: "Right", value: "right" }, { name: "Top", value: "top" }, { name: "Bottom", value: "bottom" }, { name: "Random", value: "" }],
                easing: [{ name: "Default", value: "" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            },

            warp: {
                direction: [{ name: "Left", value: "left" }, { name: "Right", value: "right" }, { name: "Top", value: "top" }, { name: "Bottom", value: "bottom" }, { name: "Random", value: "" }],
                easing: [{ name: "Default", value: "" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            },

            zoom: {
                direction: [{ name: "In", value: "in" }, { name: "Out", value: "out" }, { name: "Random", value: "" }],
                easing: [{ name: "Default", value: "" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            },

            powerzoom: {
                direction: [{ name: "In", value: "in" }, { name: "Out", value: "out" }, { name: "Random", value: "" }],
                easing: [{ name: "Default", value: "" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            },

            flash: {
                easing: [{ name: "Default", value: "" }, { name: "Fast", value: "fast" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            },
            fade: {
                easing: [{ name: "Default", value: "" }, { name: "Fast", value: "fast" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            },

            twirl: {
                direction: [{ name: "Left", value: "left" }, { name: "Right", value: "right" }, { name: "Random", value: "" }],
                easing: [{ name: "Default", value: "" }, { name: "Slow", value: "slow" }, { name: "Elastic", value: "elastic" }]
            }
        };

        addDeleteAllListeners();
        addEditListeners();
        makeSortable();

        $(".add-slides-button").click(function(e) {
            e.preventDefault();

            if (file) file.close();

            file = wp.media.frames.file = wp.media({
                title: "Edit image / video",
                button: {
                    text: "Select"
                },
                multiple: true
            });

            file.on("select", function() {
                var arr = file.state().get("selection");
                var slides = new Array();

                var existingSlides = $(".slide-item").length;
                var names = new Array();

                $(".slide-item").each(function(i, obj) {
                    names.push(parseInt($(this).attr("id")));
                });

                options.slides = options.slides || [];

                for (var i = 0; i < arr.models.length; i++) {
                    var url = arr.models[i].attributes.url;

                    slides.push({
                        url: url,
                        id: i
                    });

                    options.slides[counterForSlides] = {
                        src: url
                    };

                    createSlidesHtml(counterForSlides, url);

                    counterForSlides++;
                }

                addEditListeners();
                makeSortable();
                enableButtons();

                onSlideReorder();
            });

            file.open();
        });

        function addEditListeners() {
            $(".STX-modal-close-btn, .STX-modal-window-overlay").click(function(e) {
                closeModal();
            });

            $("#transitionEffect").change(function(e) {
                options.slides[currentSlide].transitionEffect = this.value;

                var dropdowns = ["direction", "easing"];

                for (var key in dropdowns) {
                    var val = dropdowns[key];
                    delete options.slides[currentSlide][val];
                    $("#setting-" + val).hide();
                }

                delete options.slides[currentSlide].brightness;
                delete options.slides[currentSlide].distance;
                delete options.slides[currentSlide].blur;
                $("#brightness").val("");
                $("#distance").val("");
                $("#blur").val("");

                var trOptions = transitionOptions[this.value];
                for (var key in trOptions) {
                    var dropdownId = key;
                    var $dropdown = $("#" + dropdownId).empty();
                    $("#setting-" + dropdownId).show();
                    var dropdownOptions = trOptions[key];
                    for (var key2 in dropdownOptions) {
                        var obj = dropdownOptions[key2];
                        $('<option value="' + obj.value + '">' + obj.name + "</option>").appendTo($dropdown);
                    }
                    options.slides[currentSlide][key] = dropdownOptions[0].value;
                }
            });

            $("#direction").change(function(e) {
                options.slides[currentSlide].direction = this.value;
            });

            $("#easing").change(function(e) {
                options.slides[currentSlide].easing = this.value;
            });

            $("#distance").change(function(e) {
                options.slides[currentSlide].distance = Number(this.value);
            });

            $("#brightness").change(function(e) {
                options.slides[currentSlide].brightness = Number(this.value);
            });

            $("#blur").change(function(e) {
                options.slides[currentSlide].blur = Number(this.value);
            });

            $(".media-modal-close").click(function(e) {
                $(".media-modal").hide();
                currentSlide = -1;
                unfocusLayerElement();
                $("body").css("overflow", "auto");
            });

            $(".STX-slide-src").click(function(e) {
                e.preventDefault();

                var btn = $(this);

                if (file) file.close();

                file = wp.media.frames.file = wp.media({
                    title: "Edit image / video",
                    button: {
                        text: "Select"
                    },
                    library: { type: ["image", "video/MP4"] },
                    multiple: false
                });

                file.on("select", function() {
                    var attachment = file
                        .state()
                        .get("selection")
                        .first()
                        .toJSON();
                    var attachmentUrl = attachment.url;

                    var img, video, type, ext;
                    if (/\.(jpg|jpeg|gif|png)$/i.test(attachmentUrl)) {
                        (type = img), (ext = "img");
                    } else if (/\.(mp4|ogg|ogv|webm)$/i.test(attachmentUrl)) {
                        (type = video), (ext = "video");
                    }

                    setSlideSrc(currentSlide, attachmentUrl);

                    showSlide(currentSlide);
                });

                file.open();
            });

            $(".slider-apply-btn-modal").click(function(e) {
                responseSuccess = false;
                var i = setInterval(function() {
                    if (responseSuccess) {
                        clearInterval(i);
                    }
                }, 200);
            });
        }

        function setSlideSrc(index, src) {
            options.slides[index].src = src;

            if (/\.(jpg|jpeg|gif|png)$/i.test(src)) {
                $(".STX-video-preview")
                    .eq(currentSlide)
                    .hide();
                $(".STX-image-preview")
                    .eq(currentSlide)
                    .show()
                    .attr("src", src);
            } else if (/\.(mp4|ogg|ogv|webm)$/i.test(src)) {
                $(".STX-video-preview")
                    .eq(currentSlide)
                    .show()
                    .attr("src", src);
                $(".STX-image-preview")
                    .eq(currentSlide)
                    .hide();
            }
        }

        function showSlide(index) {
            var slide = options.slides[index];
            var src = slide.src,
                type;

            if (/\.(jpg|jpeg|gif|png)$/i.test(src)) {
                type = "img";
            } else if (/\.(mp4|ogg|ogv|webm)$/i.test(src)) {
                type = "video";
            }

            currentSlideType = type;

            $editSlideModal.show();

            unfocusLayerElement();

            $(".video-container").empty();

            if (type == "img") {
                $(".slider-preview-area")[0].style.backgroundImage = 'url("' + src + '")';

                $(".STX-slide-src-preview")
                    .show()
                    .attr("src", src);
                $(".STX-slide-src-preview-video").hide();
            } else {
                $(".slider-preview-area")[0].style.backgroundImage = "none";
                var $vid = $('<video id="edit-slide-video" class="wp-video-shortcode" src="' + src + '" preload="metadata" controls style="width: 100% "></video>').appendTo($(".video-container"));

                $(".STX-slide-src-preview-video")
                    .show()
                    .attr("src", src);
                $(".STX-slide-src-preview").hide();

                $("#edit-slide-video")[0].onloadedmetadata = function() {
                    resizeLayers();
                };
            }

            $editSlideModal
                .find(".media-frame-title")
                .find("h1")
                .text("Edit slide " + String(parseInt(index) + 1));

            $editSlideModal
                .find('[data-setting="url"]')
                .find("input")
                .val(src);

            var dropdowns = ["direction", "easing"];

            for (var key in dropdowns) {
                var val = dropdowns[key];
                $("#setting-" + val).hide();
            }

            var slideOptions = options.slides[index];
            var trEffect = slideOptions.transitionEffect || "";
            $("#transitionEffect").val(trEffect);

            var trOptions = transitionOptions[slideOptions.transitionEffect];
            for (var key in trOptions) {
                var dropdownId = key;
                var $dropdown = $("#" + dropdownId).empty();
                $("#setting-" + dropdownId).show();
                var dropdownOptions = trOptions[key];
                for (var key2 in dropdownOptions) {
                    var obj = dropdownOptions[key2];
                    $('<option value="' + obj.value + '">' + obj.name + "</option>").appendTo($dropdown);
                }
            }

            $("#tabs-slide input")
                .val("")
                .prop("checked", false);
            $("#tabs-slide select").val("");

            for (var key in slideOptions) {
                var $el = $("#tabs-slide").find("#" + key);
                var val = slideOptions[key];
                typeof val == "boolean" ? $el.prop("checked", val) : $el.val(val);
            }

            clearSlideElements();
            unfocusLayerElement();

            if (slide.elements) {
                slide.elements.forEach(function(element) {
                    addNavigatorElement(element);
                });
                renderLayers();
                resizeLayers();
            } else {
                clearLayers();
            }

            resizeLayers();
        }

        function clearSlideElements() {
            $(".layer-item").remove();
        }

        function getSlideId(element) {
            return element
                .parent()
                .parent()
                .attr("id");
        }

        function closeModal() {
            modal.fadeOut("fast", function() {});

            $("body").css("overflow", "auto");

            if (modal.hasClass("previewActive")) {
                if (!$.isEmptyObject($(".slider_preview").data())) {
                    slider = $(".slider_preview").data("transitionSlider");
                    slider.stopSlider(o);
                }
            } else if (modal.hasClass("slideActive")) {
                $("video").each(function() {
                    $(this)
                        .get(0)
                        .pause();
                });
            }

            $("body").css("overflow", "auto");
        }

        function addDeleteAllListeners() {
            btnDeleteAll.click(function(e) {
                if (btns_disabled) return;

                if (confirm("Delete all slides. Are you sure?")) {
                    $(".slide-item")
                        .animate(
                            {
                                opacity: 0
                            },
                            100
                        )
                        .slideUp(200, function() {
                            $(this).remove();
                        });

                    showNotification("warning", msgDeletedSlides);

                    removeSlides();
                }
            });
        }

        function removeSlides() {
            options.slides = [];
            counterForSlides = 0;

            $("[data-slide-name]").remove();
            $("[data-slide-options-name]").remove();
        }

        function enableButtons() {
            btns_disabled = false;

            $(".STX-main-table-wrapp").fadeIn("fast");

            $(".slider-save-btn-disabled")
                .removeClass("slider-save-btn-disabled")
                .addClass("slider-save-btn-enabled");
            $(".slider-preview-btn-disabled")
                .removeClass("slider-preview-btn-disabled")
                .addClass("slider-preview-btn-enabled");
            $(".STX-slider-trash-btn-large-disabled")
                .removeClass("STX-slider-trash-btn-large-disabled")
                .addClass("STX-slider-trash-btn-large-enabled");
        }

        $(".STX-btn-menu").click(function(e) {
            if (
                $(this)
                    .parent()
                    .hasClass("STX-nav-active")
            )
                return;

            $(".STX-btn-menu")
                .parent()
                .removeClass("STX-nav-active");
            $(this)
                .parent()
                .addClass("STX-nav-active");

            $(".STX-form-tab").hide();
            $(".options_" + $(this).attr("data-form-name")).fadeIn("fast", function() {});
        });

        $(".STX-form-tab").hide();
        $(".options_publish").show();
        $(".options_slides").show();
        $('.STX-btn-menu[data-form-name="publish"]')
            .parent()
            .addClass("STX-nav-active");

        function createSlidesHtml(i, url) {
            var slideName = "Slide " + String(i + 1);

            var $slide = $(
                '<div title="Drag to reorder" id="' +
                    i +
                    '" class="STX-edit-slides-box STX-rect slide-item" data-slide-name="Slide ' +
                    i +
                    '">' +
                    '<img title="Sort"  class="STX-image-preview slide-preview" src="' +
                    url +
                    '">' +
                    '<video title="Sort"  class="STX-video-preview" slide-preview src="' +
                    url +
                    '"></video>' +
                    '<div class="STX-box-overlay-slides STX-box-on-hover-slides">' +
                    '<a name="' +
                    i +
                    '" class="STX-edit-link slide-settings STX-btn STX-button-green STX-radius-global STX-uc STX-h5" title="Edit">Edit</a>' +
                    '<div class="STX-slide-copy-btn-small btn-sm slide-duplicate" title="Duplicate"></div>' +
                    '<div class="STX-slide-trash-btn-small remove-image" name="' +
                    i +
                    '" title="Delete slide"></div>' +
                    "</div>" +
                    '<div class="STX-box-placeholder-slide" data-align="">' +
                    '<div class="STX-box-placeholder-title">' +
                    '<div class="STX-h4">' +
                    slideName +
                    "</div>" +
                    "</div>" +
                    "</div>" +
                    "</div>"
            );

            if (/\.(jpg|jpeg|gif|png)$/i.test(url)) {
                $slide.find(".STX-video-preview").hide();
                $slide.find(".STX-image-preview").show();
            } else if (/\.(mp4|ogg|ogv|webm)$/i.test(url)) {
                $slide.find(".STX-video-preview").show();
                $slide.find(".STX-image-preview").hide();
            }

            $(".STX-slides-container").append($slide);

            $slide.find(".slide-settings").click(function(e) {
                currentSlide = parseInt(getSlideId($(this)));

                $('a[data-tab="tab-general"]').click();

                showSlide(currentSlide);

                $("body").css("overflow", "hidden");
            });

            $slide.find(".slide-duplicate").click(function(e) {
                currentSlide = parseInt(getSlideId($(this)));
                var slide = options.slides[currentSlide];
                var slideClone = JSON.parse(JSON.stringify(slide));
                options.slides.push(slideClone);

                createSlidesHtml(options.slides.length - 1, slideClone.src);

                onSlideReorder();
            });

            $slide.find(".remove-image").click(function() {
                $(this)
                    .parent()
                    .parent()
                    .animate(
                        {
                            opacity: 0
                        },
                        100
                    )
                    .slideUp(200, function() {
                        $(this).remove();
                        onSlideReorder();
                    });
            });

            addEditListeners();
            makeSortable();
            enableButtons();
        }

        function showNotification(type, text) {
            $(".STX-saved-notification-wrapper")
                .stop()
                .slideUp(300);

            content.text(text);

            $(".STX-saved-notification-wrapper")
                .stop()
                .slideDown("fast", function() {
                    $(this)
                        .delay(3000)
                        .slideUp(300);
                });

            content.attr("class", "STX-saved-notification-content");

            switch (type) {
                case "success":
                    content.addClass("STX-saved-notification-success");
                    break;
                case "error":
                    content.addClass("STX-saved-notification-error");
                    break;
                case "warning":
                    content.addClass("STX-saved-notification-warning");
                    break;
            }
        }

        $(".STX-btn-copy-shortcode").click(function() {
            var id = $(this).attr("id");
            var copied = "[transitionslider id='" + id + "']";
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(copied).select();
            document.execCommand("copy");
            $temp.remove();

            $(".STX-btn-copy-shortcode").text("Copy");
            $(".STX-btn-copy-shortcode").removeClass("STX-copy-shortcode-highlight");
            $(this).addClass("STX-copy-shortcode-highlight");
            $(this).text("COPIED!");
        });


        function showLayers() {
            $('a[data-tab="tab-elements"]').click();
        }

        var $elementSettings = $editSlideModal.find(".element-settings");
        var $elementSettingsHover = $editSlideModal.find(".element-settings-hover");

        var $textElementSettings = $editSlideModal.find(".text-element-settings");
        var $imageElementSettings = $editSlideModal.find(".image-element-settings");
        var $buttonElementSettings = $editSlideModal.find(".button-element-settings");
        var $videoElementSettings = $editSlideModal.find(".video-element-settings");

        var $addTextButton = $editSlideModal.find(".add-text");
        var $addImageButton = $editSlideModal.find(".add-image");
        var $addButtonButton = $editSlideModal.find(".add-button");
        var $addVideoButton = $editSlideModal.find(".add-video");

        var renderLayersDisabled = false;

        function renderLayers() {
            if (renderLayersDisabled) return;

            layerRenderer.render(options.slides[currentSlide].elements, deviceType);
        }

        function updateDeviceType() {
            layerRenderer.setDeviceType(deviceType);
        }

        function updateCurrentElement(settingName, hover) {
            layerRenderer.updateElement(currentElement, settingName, hover);
        }

        function updateElementOffset(offset) {
            selectedElements.forEach(function(index) {
                var el = getElement(index);
                var toUpdate = el;
                if (deviceType == "mobile") {
                    el.mobile = el.mobile || {};
                    toUpdate = el.mobile;
                } else if (deviceType == "tablet") {
                    el.tablet = el.tablet || {};
                    toUpdate = el.tablet;
                }

                var o = { x: offset.x, y: offset.y };
                if (!el) return;
                if (el.mode == "content") return;
                if (el.position.x == "right") o.x *= -1;
                if (el.position.y == "center" || el.position.y == "bottom") o.y *= -1;
                toUpdate.position = toUpdate.position || {};
                toUpdate.position.offsetX = Number(toUpdate.position.offsetX || 0);
                toUpdate.position.offsetY = Number(toUpdate.position.offsetY || 0);
                toUpdate.position.offsetX += o.x;
                toUpdate.position.offsetY += o.y;
                layerRenderer.updateElement(index, "position");
                updateElementSetting("position.offsetX", parseInt(toUpdate.position.offsetX));
                updateElementSetting("position.offsetY", parseInt(toUpdate.position.offsetY));
            });
        }

        function resizeLayers() {
            if (renderLayersDisabled) return;

            if (currentSlide < 0) return;

            var self = this;
            var o = options;

            if (o.fullscreen) {
                $slider.height("100%");
            } else if (o.responsive) {
                var w = $slider.width();

                var r = o.ratio;

                var h = o.height;

                var maxHeight = o.maxHeight;
                var minHeight = o.minHeight;

                if (r) h = w / r;
                if (maxHeight && h > maxHeight) h = maxHeight;
                if (minHeight && h < minHeight) h = minHeight;

                $slider.height(h);
            } else {
                $slider.height(o.height);
            }

            layerRenderer.updateLayerSize(options, currentSlide);
        }

        function renderAddedElement() {
            layerRenderer.renderAddedElement(options.slides[currentSlide].elements);
        }

        function updateElement() {
            layerRenderer.updateElement();
        }

        function clearLayers() {
            layerRenderer && layerRenderer.render([]);
        }

        $(window).resize(function() {
            resizeLayers();
        });

        $elementSettings.find("input").on("change keyup paste", function(e) {
            if (currentElement >= 0) onElementSetingChange(this);
        });

        $elementSettings.find("select").change(function() {
            if (currentElement >= 0) onElementSetingChange(this);
        });

        $elementSettingsHover.find("input").on("change keyup paste", function(e) {
            if (currentElement >= 0) onElementSetingChange(this, true);
        });

        $elementSettingsHover.find("select").change(function() {
            if (currentElement >= 0) onElementSetingChange(this, true);
        });

        function onElementSetingChange(target, hover) {
            if (target.name) {
                var el = getCurrentElement();
                var toUpdate = el;
                if (deviceType == "mobile") {
                    el.mobile = el.mobile || {};
                    toUpdate = el.mobile;
                } else if (deviceType == "tablet") {
                    el.tablet = el.tablet || {};
                    toUpdate = el.tablet;
                }

                if (hover) {
                    toUpdate.hover = toUpdate.hover || {};
                    toUpdate = toUpdate.hover;
                }

                var val = target.type == "checkbox" ? target.checked : target.value;

                if (target.name == "position.x")
                    $('input[name="position.offsetX"]')
                        .val("")
                        .trigger("change");
                if (target.name == "position.y")
                    $('input[name="position.offsetY"]')
                        .val("")
                        .trigger("change");

                var arr = target.name.split(".");
                if (arr.length == 2) {
                    if (typeof toUpdate[arr[0]] != "object") toUpdate[arr[0]] = {};
                    toUpdate[arr[0]][arr[1]] = val;
                } else {
                    toUpdate[target.name] = val;
                }
            }
            updateCurrentElement(target.name, hover);
        }

        $('textarea[name="customCSS"]').bind("change paste", function(e) {
            var el = getCurrentElement();
            el.customCSS = $(this).val();
            updateCurrentElement("customCSS");
        });

        $('textarea[name="content"]').on("change keyup paste", function(e) {
            var el = getCurrentElement();
            el.content = $(this).val();
            updateCurrentElement("content");
        });

        $("#layerWidth").bind("change paste", function(e) {
            resizeLayers();
        });

        $("#layerHeight").bind("change paste", function(e) {
            resizeLayers();
        });

        $('select[name="mode"]').bind("change", function() {
        });

        $(".animateIt").click(function() {
            animateCSSName = $(this)
                .parent()
                .find("select")
                .val();

            animateIt();
        });

        $(".animateCSS").change(function() {
            animateCSSName = this.value;
        });

        function animateIt() {
            $('a[data-id="' + currentElement + '"]')
                .addClass("animated")
                .addClass(animateCSSName);

            setTimeout(function() {
                for (var i = 0; i < options.slides[currentSlide].elements.length; i++) {
                    $('a[data-id="' + i + '"]')
                        .removeClass("animated")
                        .removeClass(animateCSSName);
                }
            }, 1000);
        }

        function createTextElement() {
            var obj = {
                type: "text",
                mode: "content",
                content: "Text",
                contentAnimationType: "animating",
                fontSize: "16",
                fontFamily: "",
                fontWeight: "normal",
                textColor: "#FFF",
                backgroundColor: "rgba(0,0,0,0)",
                borderRadius: 0,
                position: {
                    x: "center",
                    y: "center",
                    offsetX: 0,
                    offsetY: 0
                },
                typingAnimation: {
                    speed: 50,
                    loop: false,
                    loopDelay: 750,
                    cursor: true,
                    startDelay: 0,
                    freezeAt: 0,
                    unfreezeAfter: 0
                },
                startAnimation: {
                    animation: "fadeInUp",
                    speed: 500,
                    delay: 0
                },
                endAnimation: {
                    animation: "fadeOutUp",
                    speed: 500,
                    delay: 0
                }
            };

            addLayerElement(obj);

            resetTextarea();

            $(".element-settings-tabs-wrapper").show();
            $(".slide-settings-main-menu-title").text("Element Settings");
        }

        function createButtonElement() {
            var obj = {
                type: "button",
                mode: "content",
                content: "Button",
                contentAnimationType: "animating",
                fontSize: "16",
                fontFamily: "",
                fontWeight: "normal",
                textColor: "#FFF",
                backgroundColor: "#2196f3",
                borderRadius: 0,
                position: {
                    x: "center",
                    y: "center",
                    offsetX: 0,
                    offsetY: 0
                },
                typingAnimation: {
                    speed: 50,
                    loop: false,
                    loopDelay: 750,
                    cursor: true,
                    startDelay: 0,
                    freezeAt: 0,
                    unfreezeAfter: 0
                },
                startAnimation: {
                    animation: "fadeInUp",
                    speed: 500,
                    delay: 0
                },
                endAnimation: {
                    animation: "fadeOutUp",
                    speed: 500,
                    delay: 0
                }
            };

            addLayerElement(obj);

            resetTextarea();

            $(".STX-footer-layer-btn").addClass("STX-footer-layer-btn-active");

            $(".element-settings-tabs-wrapper").show();
            $(".slide-settings-main-menu-title").text("Element Settings");
        }

        function createImageElement() {
            var obj = {
                type: "image",
                src: "",
                position: {
                    x: "center",
                    y: "center",
                    offsetX: 0,
                    offsetY: 0
                },
                startAnimation: {
                    animation: "fadeInUp",
                    speed: 500,
                    delay: 0
                },
                endAnimation: {
                    animation: "fadeOutUp",
                    speed: 500,
                    delay: 0
                }
            };

            selectImageElement(obj);
        }

        function selectImageElement(obj) {
            if (file) file.close();

            file = wp.media.frames.file = wp.media({
                title: "Select image",
                button: {
                    text: "Select"
                },
                multiple: false
            });

            file.on("select", function() {
                var attachment = file
                    .state()
                    .get("selection")
                    .first()
                    .toJSON();
                var attachmentUrl = attachment.url;

                if (obj) {
                    obj.src = attachmentUrl;
                    addLayerElement(obj);
                    $(".STX-footer-layer-btn").addClass("STX-footer-layer-btn-active");
                    onSlideReorder();
                    $(".element-settings-tabs-wrapper").show();
                    $(".slide-settings-main-menu-title").text("Element Settings");
                } else {
                    getCurrentElement().src = attachmentUrl;
                    updateElementSettings();
                    updateCurrentElement("src");
                }
            });

            file.open();
        }

        function createVideoElement() {
            var obj = {
                type: "video",
                src: "",
                position: {
                    x: "center",
                    y: "center",
                    offsetX: 0,
                    offsetY: 0
                },
                startAnimation: {
                    animation: "fadeInUp",
                    speed: 500,
                    delay: 0
                },
                endAnimation: {
                    animation: "fadeOutUp",
                    speed: 500,
                    delay: 0
                }
            };

            selectVideoElement(obj);
        }

        function selectVideoElement(obj) {
            if (file) file.close();

            file = wp.media.frames.file = wp.media({
                title: "Select video",
                button: {
                    text: "Select"
                },
                multiple: false
            });

            file.on("select", function() {
                var attachment = file
                    .state()
                    .get("selection")
                    .first()
                    .toJSON();
                var attachmentUrl = attachment.url;

                if (obj) {
                    obj.src = attachmentUrl;
                    addLayerElement(obj);
                    $(".STX-footer-layer-btn").addClass("STX-footer-layer-btn-active");
                    onSlideReorder();
                    $(".element-settings-tabs-wrapper").show();
                    $(".slide-settings-main-menu-title").text("Element Settings");
                } else {
                    getCurrentElement().src = attachmentUrl;
                    updateElementSettings();
                    updateCurrentElement("src");
                }
            });

            file.open();
        }

        $(".STX-element-image-preview").click(function() {
            selectImageElement();
        });

        $(".STX-element-video-preview").click(function() {
            selectVideoElement();
        });

        $addTextButton.click(createTextElement);
        $addImageButton.click(createImageElement);
        $addVideoButton.click(createVideoElement);
        $addButtonButton.click(createButtonElement);

        function selectFirstElement() {
            $(".layer-item")
                .first()
                .trigger("click");
        }

        function selectLastElement() {
            $(".layer-item")
                .last()
                .trigger("click");
        }

        function addNavigatorElement(obj) {
            var numItems = $(".layer-item").length;

            var $el = $('<li class="layer-item"><span class="layer-item-' + obj.type + '"></span>' + obj.type.toUpperCase() + '<a class="layer-item-duplicate" href="#"></a><a class="layer-item-trash" href="#"></a></li>');

            $el.attr("id", numItems).click(function(e) {
                e.preventDefault();
                e.stopPropagation();

                onLayerMouseDown($(this).index(), e.shiftKey);
            });

            $layerList.append($el);

            $el.find(".layer-item-duplicate").click(function(e) {
                e.preventDefault();
                e.stopPropagation();

                setCurrentElement(
                    $(this)
                        .parent()
                        .index()
                );

                duplicateLayerElement();
            });

            $el.find(".layer-item-trash").click(function(e) {
                e.preventDefault();
                e.stopPropagation();

                var index = $(this)
                    .parent()
                    .index();

                selectedElements = [index];

                deleteLayerElements();
            });
        }

        function addLayerElement(el) {
            options.slides[currentSlide].elements = options.slides[currentSlide].elements || [];

            setCurrentElement(options.slides[currentSlide].elements.length);

            options.slides[currentSlide].elements.push(el);

            addNavigatorElement(el);

            renderAddedElement();

            updateElementSettings(el);
        }

        function setCurrentElement(index) {
            currentElement = index;
        }

        function updateElementSettings(obj, hover) {
            obj = obj || getCurrentElement();

            if (obj.src) {
                if (obj.type == "image")
                    $(".STX-element-image-preview").css({
                        "background-image": "url(" + obj.src + ")",
                        "background-size": "contain"
                    });
                else if (obj.type == "video") {
                    $(".STX-element-video-preview").attr("src", obj.src);
                }
            }

            if (deviceType == "mobile") obj = obj.mobile || {};
            else if (deviceType == "tablet") obj = obj.tablet || {};

            var $container = hover ? $elementSettingsHover : $elementSettings;

            $container.find("input[type='text']").val("");
            $container.find("input[type='number']").val("");
            $container.find("select").val("");
            $container.find("textarea").val("");
            $container.find("input[type='radio']").prop("checked", "");

            for (var key in obj) {
                if (key == "hover") {
                    obj.hover.textColor = obj.hover.textColor || "";
                    obj.hover.backgroundColor = obj.hover.backgroundColor || "";
                    obj.hover.borderColor = obj.hover.borderColor || "";

                    updateElementSettings(obj.hover, true);
                } else {
                    var val = obj[key];

                    if (typeof val == "string" || typeof val == "number" || typeof val == "boolean") {
                        if ($container.find('input[name="' + key + '"]').attr("type") == "radio") {
                            $container.find('input[name="' + key + '"][value="' + val + '"]').prop("checked", "true");
                        } else if ($container.find('input[name="' + key + '"]').attr("type") == "checkbox") {
                            $container.find('input[name="' + key + '"]').prop("checked", val);
                        } else if ($container.find('input[name="' + key + '"]').hasClass("cp")) {
                            if (!val) {
                                $container
                                    .find('input[name="' + key + '"]')
                                    .parent()
                                    .parent()
                                    .find(".wp-picker-clear")
                                    .trigger("click");
                            } else $container.find('input[name="' + key + '"]').wpColorPicker("color", val);
                        } else {
                            $container.find('input[name="' + key + '"]').val(val);
                            $container.find('select[name="' + key + '"]').val(val);
                            $container.find('textarea[name="' + key + '"]').val(val);
                        }
                    } else {
                        for (var key2 in val) {
                            var val2 = val[key2];
                            if (typeof val2 == "boolean") {
                                $container.find('input[name="' + key + "." + key2 + '"]').prop("checked", val2);
                            }
                            $container.find('input[name="' + key + "." + key2 + '"]').val(val2);
                            $container.find('select[name="' + key + "." + key2 + '"]').val(val2);
                            $container.find('textarea[name="' + key + "." + key2 + '"]').val(val2);
                        }
                    }
                }
            }
            var t = getContentAnimationType();
            updateContentAnimationType(t);

            if (obj.type == "text") {
                $(".slide-settings-main-menu-title").text("Edit Text");
                $buttonElementSettings.hide();
                $imageElementSettings.hide();
                $videoElementSettings.hide();
                $textElementSettings.show();
            }
            if (obj.type == "button") {
                $(".slide-settings-main-menu-title").text("Edit Button");
                $imageElementSettings.hide();
                $textElementSettings.hide();
                $buttonElementSettings.show();
                $videoElementSettings.hide();
            }
            if (obj.type == "image") {
                $(".slide-settings-main-menu-title").text("Edit Image");
                $textElementSettings.hide();
                $buttonElementSettings.hide();
                $imageElementSettings.show();
                $videoElementSettings.hide();
            }
            if (obj.type == "video") {
                $(".slide-settings-main-menu-title").text("Edit Video");
                $textElementSettings.hide();
                $buttonElementSettings.hide();
                $imageElementSettings.hide();
                $videoElementSettings.show();
            }

            $(".accordion").accordion("refresh");

            $(".element-settings-tabs-wrapper").show();

        }

        function getContentAnimationType() {
            return $('select[name="contentAnimationType"]').val();
        }

        function updateElementSetting(name, val, hover) {
            var $container = hover ? $elementSettingsHover : $elementSettings;
            $container.find('input[name="' + name + '"]').val(val);
        }

        function unfocusLayerElement() {
            $(".element-settings-tabs-wrapper").hide();
            $(".slide-settings-main-menu-title").text("Slide Settings");
            layerRenderer.unfocusElement();
            $(".selected-layer").removeClass("selected-layer");
            selectedElements = [];
            setCurrentElement(-1);
        }

        var $layerListPopup = $(".layer-list-popup")
            .draggable({
                handle: ".layer-list-popup-title",
                containment: ".slider-preview-wrapper"
            })
            .resizable({
                autoHide: true,
                minWidth: 200,
                maxWidth: 350,
                minHeight: 150,
                containment: ".slider-preview-wrapper"
            });

        showLayerListPopup();

        function hideLayerListPopup() {
            $layerListPopup.hide();
            $(".STX-footer-layer-btn").removeClass("STX-footer-layer-btn-active");
        }

        function showLayerListPopup() {
            $layerListPopup.show();
            $(".STX-footer-layer-btn").addClass("STX-footer-layer-btn-active");
        }

        function toggleLayerListPopup() {
            $layerListPopup.toggle();
            $(".STX-footer-layer-btn").toggleClass("STX-footer-layer-btn-active");
        }

        var $layerList = $(".layers-wrapper")
            .sortable({
                axis: "y",
                stop: function(event, ui) {
                    var newArr = [];

                    var arr = $(".layer-item").each(function(key, val) {
                        newArr[key] = options.slides[currentSlide].elements[Number(val.id)];
                    });

                    arr.each(function(key, val) {
                        val.id = key;
                    });

                    options.slides[currentSlide].elements = newArr;

                    renderLayers();
                }
            })
            .disableSelection();

        $(".layer-list-popup-close").click(function() {
            hideLayerListPopup();
        });

        $(".slider-preview-area").click(function(e) {
            if (!$(e.target).hasClass("element")) unfocusLayerElement();
        });

        function getCurrentElement() {
            return options.slides[currentSlide].elements[currentElement];
        }

        function getElement(index) {
            return options.slides[currentSlide].elements[index];
        }

        function getCurrentSlide() {
            return options.slides[currentSlide];
        }

        function onLayerClick(val, shiftKey) {
            var el = getCurrentElement();

            if (el) {
                if (el.type == "text") jQuery("#text-content").focus();
                else if (el.type == "button") jQuery("#button-content").focus();
            }
        }

        function onLayerMouseDown(val, shiftKey) {
            setCurrentElement(val);

            if (!shiftKey) {
                $(".selected-layer").removeClass("selected-layer");
                layerRenderer.unfocusElement();
                selectedElements = [];
            }

            if (!selectedElements.includes(currentElement)) selectedElements.push(currentElement);

            $(".layer-item")
                .eq(currentElement)
                .addClass("selected-layer");

            updateElementSettings();

            layerRenderer.focusElement(currentElement);

            $(".element-settings-tabs-wrapper").show();
        }

        function onLayerMove(offset) {
            updateElementOffset(offset);
        }

        var layerRenderer = new STX.LayerRenderer({
            onLayerClick: onLayerClick,
            onLayerMouseDown: onLayerMouseDown,
            onLayerMove: onLayerMove
        });

        $('.device[data-type="desktop"]').click();


        var $menu = $(".right-click-menu"),
            menu = $menu[0],
            menuVisible = false;

        $(".menu-option-copy").click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();

            copyLayerElements();
        });

        $(".menu-option-duplicate").click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();

            duplicateLayerElement();
        });

        $(".menu-option-delete").click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();

            deleteLayerElements();
        });

        $(".menu-option-paste").click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();

            pasteLayerElements();
        });

        $(".element-template").click(function(e) {
            var style = this.style;
            var border = this.style.border;

            var el = getCurrentElement();
            var style = jQuery(this).css(["color", "backgroundColor", "fontSize", "fontWeight", "paddingTop", "paddingLeft", "paddingRight", "paddingBottom", "borderWidth", "borderColor", "borderStyle", "borderRadius", "fontFamily"]);

            for (var property in style) {
                if (style.hasOwnProperty(property)) {
                    if (property === "color") el["textColor"] = style[property];
                    else el[property] = style[property];
                    updateCurrentElement(property);
                }
            }

            onLayerMouseDown(currentElement);
        });

        function copyLayerElements() {
            if (currentSlide < 0) return;

            layerClipboard = [];

            selectedElements.forEach(function(index) {
                var el = getElement(index);
                layerClipboard.push(JSON.parse(JSON.stringify(el)));
            });
        }

        function pasteLayerElements() {
            if (currentSlide < 0) return;

            var $elem = jQuery(document.activeElement);
            if ($elem.parents(".element-settings").length == 0) {
                layerClipboard.forEach(function(el) {
                    var clone = JSON.parse(JSON.stringify(el));
                    clone.id = null;
                    addLayerElement(clone);
                });

                $(".layer-item").each(function(key, val) {
                    val.id = key;
                });
            }
        }

        function deleteLayerElements() {
            if (currentSlide < 0) return;


            selectedElements.sort().reverse();

            selectedElements.forEach(function(index) {
                var id = options.slides[currentSlide].elements[index].id;
                var script = document.getElementById("s" + id);
                script.parentNode.removeChild(script);

                options.slides[currentSlide].elements.splice(index, 1);

                $(".layer-item")
                    .eq(index)
                    .remove();
            });

            selectedElements = [];

            $(".layer-item").each(function(key, val) {
                val.id = key;
            });

            renderLayers();
        }

        function duplicateLayerElement() {
            if (currentSlide < 0) return;

            var el = getCurrentElement();
            var clone = JSON.parse(JSON.stringify(el));
            clone.id = null;
            addLayerElement(clone);

            $(".layer-item").each(function(key, val) {
                val.id = key;
            });

            selectLastElement();
        }

        function inputFocused() {
            var type = document.activeElement.type;
            return type == "textarea" || type == "text" || type == "number";
        }

        var toggleMenu = function toggleMenu(command) {
            menu.style.display = command === "show" ? "block" : "none";
            menuVisible = !menuVisible;
        };

        var setPosition = function setPosition(_ref) {
            var top = _ref.top,
                left = _ref.left;
            menu.style.left = "".concat(left, "px");
            menu.style.top = "".concat(top, "px");
            toggleMenu("show");
        };

        window.addEventListener("click", function(e) {
            if (menuVisible) toggleMenu("hide");
        });
        window.addEventListener("contextmenu", function(e) {
            if ($(e.target.parentNode.parentNode.parentNode).hasClass("stx-layers-content")) {
                e.preventDefault();
                var origin = {
                    left: e.pageX - $(".slider-preview-area").offset().left,
                    top: e.pageY - $(".slider-preview-area").offset().top
                };
                setPosition(origin);

                $(".menu-option").addClass("menu-option-disabled");

                if (selectedElements.length) {
                    $(".menu-option-copy").removeClass("menu-option-disabled");
                    $(".menu-option-delete").removeClass("menu-option-delete");
                }

                if (layerClipboard.length) $(".menu-option-paste").removeClass("menu-option-disabled");
            } else if ($(e.target).hasClass("element")) {
                e.preventDefault();
                var origin = {
                    left: e.pageX - $(".slider-preview-area").offset().left,
                    top: e.pageY - $(".slider-preview-area").offset().top
                };
                setPosition(origin);

                $(".menu-option-disabled").removeClass("menu-option-disabled");

                if (layerClipboard.length == 0) $(".menu-option-paste").addClass("menu-option-disabled");

                setCurrentElement(Number(e.target.id));
            } else {
                toggleMenu();
            }

            return false;
        });

        document.onkeydown = function(e) {
            e = e || window.event;

            if (e.keyCode == "38") {
                if (currentElement > -1) {
                    var offset = { x: 0, y: 0 };
                    if (e.shiftKey) offset.y -= 10;
                    else offset.y -= 1;
                    updateElementOffset(offset);
                }
            } else if (e.keyCode == "40") {
                if (currentElement > -1) {
                    var offset = { x: 0, y: 0 };
                    if (e.shiftKey) offset.y += 10;
                    else offset.y += 1;
                    updateElementOffset(offset);
                }
            } else if (e.keyCode == "37") {
                if (currentElement > -1) {
                    var offset = { x: 0, y: 0 };
                    if (e.shiftKey) offset.x -= 10;
                    else offset.x -= 1;
                    updateElementOffset(offset);
                } else if (currentSlide > -1) {
                    if (document.activeElement.tagName != "INPUT") showPrevSlide();
                }
            } else if (e.keyCode == "39") {
                if (currentElement > -1) {
                    var offset = { x: 0, y: 0 };
                    if (e.shiftKey) offset.x += 10;
                    else offset.x += 1;
                    updateElementOffset(offset);
                } else if (currentSlide > -1) {
                    if (document.activeElement.tagName != "INPUT") showNextSlide();
                }
            } else if (e.keyCode == "46" || e.keyCode == "8") {
                if (inputFocused()) return;

                deleteLayerElements();
            }
        };

        window.addEventListener("copy", function(e) {
            copyLayerElements();
        });

        window.addEventListener("paste", function() {
            pasteLayerElements();
        });
    });
})(jQuery);

function stripslashes(str) {
    return (str + "").replace(/\\(.?)/g, function(s, n1) {
        switch (n1) {
            case "\\":
                return "\\";
            case "0":
                return "\u0000";
            case "":
                return "";
            default:
                return n1;
        }
    });
}
