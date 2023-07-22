const dotenv = require("dotenv").config();
const { generateImageAndSave } = require("./imageGenerator.js");

/**
 * Print the readme contents
 * @param {string} imageName
 * @param {string} prompt
 * @param {string} username
 * @returns
 */
function printReadme(imageName, prompt, username) {
	const content = `
<div align="center">
  <a href="https://zank.it" target="_blank"><img src="https://raw.githubusercontent.com/zk-g/zk-g/main/${imageName}" width="1024px"></a>
  <br>
  <br>
  <br>
  <p class="has-text-grey"><i>"${prompt}"</i> by <a href="https://github.com/${username}" target="_blank">@${username}</a></p>
  <p><samp><a href="https://github.com/zanhk/zanhk/discussions/new?category=prompt">Generate a new image</a></samp></p>
</div>`;
	return content;
}

const promt = process.env.OPENAI_PROMPT || "Two futuristic towers with a skybridge covered in lush foliage, digital art";
const username = process.env.GITHUB_USERNAME || "zanhk";
const issueId = process.env.GITHUB_DISCUSSION_NUMBER || 0;
const size = process.env.OPENAI_OPTION_SIZE || "1024x1024";

const writeReadme = async function () {
	var generatedImageRes = await generateImageAndSave(promt, issueId, username, size);
	var readMeContent = printReadme(generatedImageRes.file.path, generatedImageRes.prompt, generatedImageRes.username);
	console.info(`${readMeContent}`);
};

writeReadme();
