"use strict";
import { dirname, resolve } from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";

import yargs from "yargs";
import chalk from "chalk";

const readCnabFile = async (file) => {
  try {
    const content = await readFile(file, "utf8");
    return content.split("\n");
  } catch (error) {
    console.error(error);
    throw new Error("error while reading file");
  }
};

const segmentPosition = 13;

const filterBySegment = (cnabBody, segment) =>
  cnabBody.filter((line) => line.charAt(segmentPosition) === segment);

const messageLogHeader = (
  segmentType,
  from,
  to
) => `----- Cnab linha ${segmentType} -----

posição from: ${chalk.inverse.bgBlack(from)}
posição to: ${chalk.inverse.bgBlack(to)}`;

const messageLogFooter = () => `----- FIM ------`;

const messageLog = (lines, from, to) => `
item isolado: ${chalk.inverse.bgBlack(lines.substring(from - 1, to))}

item dentro da linha P:
  ${lines.substring(0, from)}${chalk.inverse.bgBlack(
  lines.substring(from - 1, to)
)}${lines.substring(to)}
`;

const optionsYargs = yargs(process.argv.slice(2))
  .usage("Uso: $0 [options]")
  .option("f", {
    alias: "from",
    describe: "posição inicial de pesquisa da linha do Cnab",
    type: "number",
    demandOption: true,
  })
  .option("t", {
    alias: "to",
    describe: "posição final de pesquisa da linha do Cnab",
    type: "number",
    demandOption: true,
  })
  .option("s", {
    alias: "segmento",
    describe: "tipo de segmento",
    type: "string",
    demandOption: true,
  })
  .option("p", {
    alias: "path",
    describe: "caminho do arquivo CNAB",
    type: "string",
    demandOption: false,
  })
  .example(
    "$0 -f 21 -t 34 -s p",
    "lista a linha e campo que from e to do cnab"
  ).argv;

const { from, to, segmento, path } = optionsYargs;

let file = null;

if (path) {
  file = resolve(path);
} else {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const defaultFilePath = `${__dirname}/cnabExample.rem`;
  file = resolve(defaultFilePath);

  console.log(
    `Atenção, não foi informado o caminho do arquivo Cnab. O arquivo padrão indicado abaixo será utilizado: \n ${defaultFilePath}`
  );
}

const log = console.log;

console.time("leitura Async");

try {
  const cnabArray = await readCnabFile(file);

  // const cnabHeader = cnabArray.slice(0, 2);
  const cnabBody = cnabArray.slice(2, cnabArray.length - 2);

  const cnabBodySegmentsP = filterBySegment(cnabBody, "P");
  const cnabBodySegmentsQ = filterBySegment(cnabBody, "Q");
  const cnabBodySegmentsR = filterBySegment(cnabBody, "R");

  const getLinesBySegment = (segment) => {
    const segmentMapper = {
      p: cnabBodySegmentsP,
      q: cnabBodySegmentsQ,
      r: cnabBodySegmentsR,
    };
    return segmentMapper[segment] || [];
  };

  const lines = getLinesBySegment(segmento);

  log(messageLogHeader(segmento, from, to));
  lines.map((line) => {
    log(messageLog(line, from, to));
  });
  log(messageLogFooter());
} catch (error) {
  console.error(error);
}

console.timeEnd("leitura Async");