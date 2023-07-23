const dotenv = require("dotenv").config();
const { generateImageAndSave } = require("./imageGenerator.js");
const fs = require("fs");

/**
 * Print the readme contents
 * @param {string} imageName
 * @param {string} prompt
 * @param {string} username
 * @returns
 */
function printReadme(imageName, prompt, model, username) {
	const content = `
<div align="center">
  <a href="https://zank.it" target="_blank"><img src="https://raw.githubusercontent.com/zanhk/zanhk/main/${imageName}" width="1024px"></a>
  <br>
  <br>
  <br>
  <p class="has-text-grey"><i>"${prompt}"</i> by <a href="https://github.com/${username}" target="_blank">@${username}</a> using ${model}</p>
  <p><samp><a href="https://github.com/zanhk/zanhk/discussions/new?category=prompt">Generate a new image</a></samp></p>
</div>`;
	return content;
}

const promt = process.env.PROMPT || "Two futuristic towers with a skybridge covered in lush foliage, digital art";
const body = process.env.DISCUSSION_BODY;
const username = process.env.GITHUB_USERNAME || "zanhk";
const issueId = process.env.GITHUB_DISCUSSION_NUMBER || 0;
const size = process.env.IMAGE_SIZE || "1024";

const getModel = function (discussionBody) {
	let model = "DALL-E";

	console.debug("Discussion body: " + discussionBody);

	if (discussionBody.includes("DALL-E")) {
		model = "DALL-E";
	} else if (discussionBody.includes("Stable diffusion")) {
		model = "Stable diffusion";
	}

	return model;
};

/**
 * Write the readme content to the console
 */
const writeReadme = async function (model) {
	var generatedImageRes = await generateImageAndSave(model, promt, issueId, username, size);
	var readMeContent = printReadme(generatedImageRes.file.path, generatedImageRes.prompt, generatedImageRes.model, generatedImageRes.username);

	// write to README.md
	fs.writeFile("README.md", readMeContent, (err) => {
		if (err) {
			console.error("There was an error writing the file.", err);
		} else {
			console.debug("Successfully wrote to README.md");
		}
	});
};

let model = getModel(body);

console.debug("Model: " + model);

writeReadme(model);
