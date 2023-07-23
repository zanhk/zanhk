const { Configuration, OpenAIApi } = require("openai");
const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const Jimp = require("jimp");

var Filter = require("bad-words");

var customFilter = new Filter({ placeHolder: "x" });

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const stableDiffusionApiKey = process.env.STABLE_DIFFUSION_API_KEY;

/**
 * You guessed! it writes text to an image
 * @param {*} file
 * @param {string} text
 */
async function writeTextToImage(file, text) {
	const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

	const image = await Jimp.read(file.path);

	// Get the width and height of the image and the text
	const imageWidth = image.bitmap.width;
	const imageHeight = image.bitmap.height;
	const textWidth = Jimp.measureText(font, text);

	// Calculate the x and y positions for the text
	const xPos = imageWidth - textWidth - 20; // 20 pixels from the right edge
	const yPos = imageHeight - 30; // 20 pixels from the bottom edge

	// Print the text onto the image at the calculated position
	image.print(font, xPos, yPos, text);

	const mask = await Jimp.read("./mask.png");

	image.mask(mask, 0, 0);

	return image.write(file.path);
}

async function openAiGenerateImage(prompt, size, imageName) {
	const response = await openai.createImage({
		prompt: prompt,
		n: 1,
		size: size + "x" + size,
	});

	const file = fs.createWriteStream(`images/${imageName}.png`);

	const request = await http.get(response.data.data[0].url, function (response) {
		response.pipe(file);
		file.on("finish", () => {
			writeTextToImage(file, "zank.it");
			file.close();
		});
	});

	return request;
}

async function stableDiffusionGenerateImage(prompt, size, imageName) {
	const path = "https://api.stability.ai/v1/generation/stable-diffusion-xl-beta-v2-2-2/text-to-image";

	const headers = {
		Accept: "application/json",
		Authorization: stableDiffusionApiKey,
	};

	const body = {
		width: size,
		height: size,
		steps: 50,
		seed: 0,
		cfg_scale: 7,
		samples: 1,
		style_preset: "enhance",
		text_prompts: [
			{
				text: prompt,
				weight: 1,
			},
		],
	};

	// const response = fetch(path, {
	// 	headers,
	// 	method: "POST",
	// 	body: JSON.stringify(body),
	// });

	// if (!response.ok) {
	// 	throw new Error(`Non-200 response: ${await response.text()}`);
	// }

	// const responseJSON = await response.json();

	// // Should always be 1 image, if more overwrite the previous one
	// responseJSON.artifacts.forEach((image, index) => {
	// 	fs.writeFileSync(`images/${imageName}.png`, Buffer.from(image.base64, "base64"));
	// });

	// return response;

	const options = {
		hostname: "api.stability.ai",
		path: path,
		method: "POST",
		headers: headers,
	};

	const request = new Promise((resolve, reject) => {
		http.request(options, (res) => {
			let data = "";

			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				const responseJSON = JSON.parse(data);

				// get the image from response
				const image = responseJSON.artifacts[0];

				// save the image
				const imagePath = `images/${imageName}.png`;
				fs.writeFileSync(imagePath, Buffer.from(image.base64, "base64"));

				resolve({
					file: {
						path: imagePath,
					},
					prompt: prompt,
					username: username,
				});
			});
		})
			.on("error", (error) => {
				console.error(error);
				reject(error);
			})
			.end(JSON.stringify(body));
	});

	return request;
}

/**
 * Generate an image and save it to the images folder
 * @param {string} prompt
 * @param {string} username
 * @returns
 */
async function generateImageAndSave(model, prompt, issueId, username, size) {
	var imageName = issueId;

	var cleanedPromt = customFilter.clean(prompt);

	let request = null;

	switch (model) {
		case "dall-e":
			request = await openAiGenerateImage(cleanedPromt, size, imageName);
			break;
		case "stable-diffusion":
			request = await stableDiffusionGenerateImage(cleanedPromt, size, imageName);
			break;
		default:
			request = await openAiGenerateImage(cleanedPromt, size, imageName);
			break;
	}

	return {
		prompt: cleanedPromt,
		username: username,
		file: file,
		request: request,
	};
}

module.exports = {
	generateImageAndSave: generateImageAndSave,
};
