// «Каталог 3D-моделей» — Figma Catalog-default 2338:254259 (1440) и
// catalog 2338:254303 (360). Фрейм лежит в секции B2b additional и в карте
// назван «Каталог (вариант)»: он повторяет дилерский каталог нода в ноду,
// кроме карточки — здесь это компонент `3D` 322×418 с рендером, строкой
// формата, образцами цветов и «Скачать».
//
// В макете все тридцать карточек одинаковые — это филлер, а не данные.
// Строка формата и подпись кнопки лежат в мастере и одни на все карточки.
//
// Собрано: node gen-3d.mjs

import { ASSET_ROOT } from "./asset-base.js";

const MODELS = `${ASSET_ROOT}/models`;

export const MODEL_SPEC = "3dsMax 2021, Corona render, 74.32 MB";
export const MODEL_ACTION = "Скачать";

export const MODELS_LIST = [
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: "" },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-1.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-2.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-3.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-4.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-5.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-6.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-7.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-8.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-9.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-10.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-11.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-12.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-13.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-14.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-15.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-16.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-17.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-18.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-19.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-20.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-21.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-22.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: "" },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-6.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-4.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-5.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-3.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-8.jpg` },
  { title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм", img: `${MODELS}/model-7.jpg` },
];
