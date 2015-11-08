/*
Created by Ralf Becher - ralf.becher@web.de - (c) 2015 irregular.bi, Leipzig, Germany
Tested on QlikView 11.2

irregular.bi takes no responsibility for any code.
Use at your own risk. 
*/
(function ($) {
	var _extension = 'VariablesTableEditor';
    var _path = 'Extensions/' + _extension + '/';
	var _pathLong = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only&name=' + _path;
	// detect WebView mode (QlikView Desktop)
	var _webview = window.location.host === 'qlikview';
	var _files = [];
	// create array with all need libraries
    _files.push(_path + 'js/jquery.dataTables.min.js');
    _files.push(_path + 'js/jquery.format-1.3.min.js');
	// load all libraries as array, don't use nested Qva.LoadScript() calls
	Qv.LoadExtensionScripts(_files, 
		function () {
		// load css file
		Qva.LoadCSS((_webview ? _path : _pathLong) + 'css/jquery.dataTables.min.css');
		Qva.LoadCSS((_webview ? _path : _pathLong) + 'css/jqdt-custom.css');
		Qva.LoadCSS((_webview ? _path : _pathLong) + 'css/jquery-ui.min.css');

		Qv.AddExtension(_extension, function () {
			var pageSize = this.Layout.Text0.text.toString() * 1;
			var showSysVars = ((this.Layout.Text1.text.toString() * 1) > 0);
			var id = this.Layout.ObjectId.replace("\\", "_");

			var container = $('<div />').css({
									height: this.GetHeight(),
									width: this.GetWidth(),
									overflow: 'auto',
									'font-family': 'Helvetica',
									'font-size': '0.8em'
								}).appendTo($(this.Element).empty());

			Qv.GetCurrentDocument().GetAllVariables(function(vars) {
				if (typeof vars == 'object') {
					var myTable = $('<table />').attr({id: id, class: "display"}).appendTo(container);

					var headerSet = $.map(['Variable','Value'], function( column, index ){
										if (index == 0) {
											return { 
													title: column, 
													targets: index, 
													width: "34%",
													className: "jqdtdimension-" + index + " jqdt-variable"
												};
										} else {
											return { 
													title: column, 
													targets: index, 
													width: "64%",
													className: "jqdtdimension-" + index + " jqdt-value"
												};
										}
									});
					if (!showSysVars) {
						vars = vars.filter(function(row){ return !(row.isconfig == "true" || row.isreserved == "true") });
					}

					var dataSet = vars.map(function( row ){ 
										return [row.name,""+row.value];
									});
														
					// render jQuery DataTable
					var myDataTable = myTable.DataTable({ 
							data: dataSet,
							pageLength: pageSize,
							columnDefs: headerSet, 
							dom: '<"toolbar">frtip',
							responsive: false
						});

					var replaceWith = $('<textarea />').attr({name: "temp", class: "datatable" }).css({ padding: "0.4em", "font-family": "Arial", height: 16, width: "94%"}),
						connectWith = $('input[name="hiddenField"]');
					
					var mode = { edit: false };
					$("#" + id + " tbody").on( 'click', 'td', function () {
						$(this).inlineEdit(replaceWith, connectWith, myDataTable.cell(this).index(), mode);
					});
										
				} else {
					container.append($('<div>No Variables defined..</div>'));
				}
			});
		});	
	});	
})(jQuery);

$.fn.inlineEdit = function(replaceWith, connectWith, index, mode) {
	console.log(index,mode.edit);
 	if (index && index.column == 1 && !mode.edit) {
		mode.edit = true;
		var elem = $(this);
		var varName = $('td:first', $(this).parent()).text();
		var varValue = elem.text();

		elem.hide();
		elem.after(replaceWith);
		$(replaceWith).height(Math.max(16,elem.height()));
		if (varValue == "") {
			$(replaceWith).val("...");
			$(replaceWith).select();
		} else {
			$(replaceWith).val(varValue);
		}
		console.log(replaceWith);
		$(replaceWith).focus();
	}
	$(replaceWith).blur(function() {
		varValue = $(this).val();
		if (!(elem.text() == "" && varValue == "...")) {
			connectWith.val(varValue).change();
			elem.text(varValue);
		}
		$(this).remove();
		elem.show();
		mode.edit = false;
		Qv.GetCurrentDocument().SetVariable(varName, varValue);
	});
};