var data_left = { image: null, width: 0, height: 0, scale: 1.0, center_x: 0, center_y: 0, rot: 0, prevRot: 0 };
var data_right = Object.assign({}, data_left);

var ctx_raw_left, ctx_raw_right;
var cv_color_left, ctx_color_left, cv_color_right, ctx_color_right;
var ctx_final_preview;

var dispMode = 'filtered';

// ToDo: ドラッグによる移動
// var drag_init_x, drag_init_y;

window.onload = function() {

	ctx_raw_left = document.getElementById("pv_left").getContext("2d");
	ctx_raw_left.globalCompositeOperation = "copy";
	ctx_raw_right = document.getElementById("pv_right").getContext("2d");
	ctx_raw_right.globalCompositeOperation = "copy";

	cv_color_left = document.createElement("canvas");
	cv_color_left.width = 2048;
	cv_color_left.height = 2048;
	ctx_color_left = cv_color_left.getContext("2d");
	ctx_color_left.globalCompositeOperation = "copy";
	cv_color_right = document.createElement("canvas");
	cv_color_right.width = 2048;
	cv_color_right.height = 2048;
	ctx_color_right = cv_color_right.getContext("2d");
	ctx_color_right.globalCompositeOperation = "copy";

	ctx_final_preview = document.getElementById("canvas_main").getContext("2d");
	ctx_final_preview.globalCompositeOperation = "lighter";

}

// ファイルが選択されたときの動作
function onFileSelect(file, side) {
	let data = window["data_" + side];
	data.image = new Image();
	data.image.onload = function() {
		data.width = data.image.width;
		data.height = data.image.height;
		drawRawImage(side);
	}
	data.image.src = window.URL.createObjectURL(file);
}

// プレビュー（生画像）に画像を描画する。
function drawRawImage(side) {
	let ctx = window["ctx_raw_" + side];
	ctx.translate(1024, 1024);
	let data = window["data_" + side];
	ctx.rotate(rad(data.rot));
	let w = data.width / Math.max(data.width, data.height) * 2048 * data.scale;
	let h = data.height / Math.max(data.width, data.height) * 2048 * data.scale;
	let nx = data.center_x * Math.cos(-rad(data.rot)) - data.center_y * Math.sin(-rad(data.rot));
	let ny = data.center_x * Math.sin(-rad(data.rot)) + data.center_y * Math.cos(-rad(data.rot));
	ctx.drawImage(data.image, -0.5 * w + nx, -0.5 * h + ny, w, h);
	ctx.rotate(-rad(data.rot));
	ctx.translate(-1024, -1024);

	filterColor(side);
}

// 赤青画像にする。
function filterColor(side) {
	let ctx_raw = window["ctx_raw_" + side];
	let ctx_clr = window["ctx_color_" + side];
	let pixelData = ctx_raw.getImageData(0, 0, 2048, 2048);
	if (side == "left") {
		for (let i = 0; i < pixelData.data.length; i += 4) {
			pixelData.data[i + 1] = 0;
			pixelData.data[i + 2] = 0;
		}
	} else {
		for (let i = 0; i < pixelData.data.length; i += 4) {
			pixelData.data[i] = 0;
		}
	}
	ctx_clr.putImageData(pixelData, 0, 0);

	finalPreview();
}

// プレビュー画面に焼き込む。
function finalPreview() {
	let pixelData1;
	let pixelData2;
	if (dispMode == 'filtered') {
		pixelData1 = ctx_color_left.getImageData(0, 0, 2048, 2048);
		pixelData2 = ctx_color_right.getImageData(0, 0, 2048, 2048);
		for (let i = 0; i < pixelData1.data.length; i += 4) {
			pixelData1.data[i+1] = pixelData2.data[i+1];
			pixelData1.data[i+2] = pixelData2.data[i+2];
			pixelData1.data[i+3] = ((pixelData1.data[i+3] || pixelData2.data[i+3]) ? 256 : 0);
		}
	} else {
		pixelData1 = ctx_raw_left.getImageData(0, 0, 2048, 2048);
		pixelData2 = ctx_raw_right.getImageData(0, 0, 2048, 2048);
		for (let i = 0; i < pixelData1.data.length; i += 4) {
			pixelData1.data[i] = (pixelData1.data[i] + pixelData2.data[i]) / 2;
			pixelData1.data[i + 1] = (pixelData1.data[i + 1] + pixelData2.data[i + 1]) / 2;
			pixelData1.data[i + 2] = (pixelData1.data[i + 2] + pixelData2.data[i + 2]) / 2;
			pixelData1.data[i + 3] = ((pixelData1.data[i + 3] || pixelData2.data[i + 3]) ? 256 : 0);
		}
	}
	ctx_final_preview.putImageData(pixelData1, 0, 0);
}

// 弧度法にする
function rad(deg) {
	return deg * Math.PI / 180;
}

// 平行法表示と交差法表示を切り替える
function previewMode(isCross) {
	document.getElementById("stereo_preview").style.flexDirection = (isCross ? "row-reverse" : "row");
}