const stream = require("stream");
const archiver = require("archiver");
const AWS = require("aws-sdk");
const S3 = new AWS.S3();

const handler = async (event) => {
  const { bucket, files, zippedFileKey } = JSON.parse(event.Records[0].body);
  const passthrough = new stream.PassThrough();
  const uploadPromise = S3.upload({
    Bucket: bucket,
    Key: zippedFileKey,
    ContentType: "application/zip",
    Body: passthrough,
  }).promise();

  const archive = archiver("zip");

  archive.on("error", (error) => {
    throw new Error(
      `${error.name} ${error.code} ${error.message} ${error.path}  ${error.stack}`
    );
  });

  archive.pipe(passthrough);

  for (const file of files) {
    const stream = S3.getObject({
      Bucket: bucket,
      Key: file,
    }).createReadStream();
    archive.append(stream, { name: file });
  }

  await archive.finalize();
  return await uploadPromise;
};

module.exports = {
  handler,
};