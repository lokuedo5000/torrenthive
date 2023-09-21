const { app, BrowserWindow, dialog } = require('electron');
const si = require("systeminformation");
const { v4: uuidv4 } = require('uuid');
const parseTorrent = require("parse-torrent");

const moment = require('moment');

const path = require("path");
const fs = require("fs");

const TorrentHash = require("../modules/torrent-hash");
const torrenthash = new TorrentHash();

const UtilNode = require("../modules/utilnode");
const utilnode = new UtilNode({
  electron: { dialog, BrowserWindow },
  uuid: { uuidv4 },
  si: si,
  parseTorrent: parseTorrent,
});

const TorrentDownload = require("./app/modules/torrent-download");
const torrentdownload = new TorrentDownload();

let cache = {};

function errorCache(error, data) {
  if (!cache["alerts"]) {
    cache["alerts"] = [];
  }

  const datemoment = moment();
  const date = datemoment.format('D [de] MMM. YYYY');
  cache["alerts"].unshift({
    title: error.code || error.title || null,
    message: error.message,
    data: error.extra || null,
    date
  });
}

const lib = require("../modules/util-libraries")


const routes = [
  {
    method: "get",
    path: "/",
    handler: (req, res) => {
      // render
      res.render(path.join(__dirname, "app", "views", "index"));
    },
  },
  {
    method: "get",
    path: "/downloads",
    handler: (req, res) => {
      // render
      res.render(path.join(__dirname, "app", "views", "downloads"));
    },
  },
  {
    method: "get",
    path: "/cog",
    handler: (req, res) => {
      // render
      res.render(path.join(__dirname, "app", "views", "cog"));
    },
  },
  {
    method: "get",
    path: "/alert",
    handler: (req, res) => {
      // render
      res.render(path.join(__dirname, "app", "views", "alert"), {
        alerts: cache["alerts"] || []
      });
    },
  },
  {
    method: "post",
    path: "/new-download",
    handler: async (req, res) => {
      let { hash, magnet, peso, timeoutMilliseconds = (1000 * 30) } = req.body;
      let selectFolder = null;
      try {
        selectFolder = await utilnode.openFolder();
      } catch (error) {
        errorCache(error);
        res.send(false);
        return;
      }

      try {
        await torrentdownload.download(selectFolder, { hash, magnet, peso, timeoutMilliseconds });
        res.json(true);
      } catch (error) {
        error.extra = await utilnode.getInfoTorrent(magnet);
        errorCache(error);
        res.send(false);
        return;
      }
    },
  },
  {
    method: "post",
    path: "/action-download",
    handler: (req, res) => {
      let { action, hash, magnet } = req.body;
      if (action == "pause") {
        torrentdownload.pause(hash)
      } else if (action == "stop") {
        torrentdownload.stop(hash)
      }

      res.end();
    },
  },
  {
    method: "post",
    path: "/torrent-info",
    handler: async (req, res) => {
      let { torrent, type } = req.body;
      let parse = await utilnode.getInfoTorrent(torrent);
      if (type == "file") {
        res.json(parse)
      } else if (type == "magnet") {
        try {
          let getTorrentInfo = await torrenthash.getDataTorrent(parse.infoHash, torrent, (1000 * 30));
          res.json(getTorrentInfo)
        } catch (error) {
          error.extra = parse;
          errorCache(error);
          res.send(false);
        }
      }

    },
  },
  {
    method: "post",
    path: "/get-info-downloads",
    handler: (req, res) => {
      let { action, hash } = req.body;
      if (action == "hashs") {
        res.json(torrentdownload.hashs);
      } else if (action == "downloads") {
        res.json(torrentdownload.downloads[hash] || false);
      } else if (action == "stop") {

      } else if (action == "pause") {

      }
    },
  },
  {
    method: "get",
    path: "/system/:method",
    handler: async (req, res) => {
      let pr = req.params;

      if (pr.method == "disks") {
        let veryCache = cache[pr.method];

        if (!veryCache) {
          cache[pr.method] = await utilnode.fsSize();
          res.json(cache[pr.method]);
        } else {
          res.json(cache[pr.method]);
        }

      } else {
        res.send(null);
      }

    },
  },
  {
    method: "post",
    path: "/open-file",
    handler: async (req, res) => {
      const selectedFile = await utilnode.openFile({
        title: "Seleccionar archivo",
        filters: [{ name: "Archivo Torrent", extensions: ["torrent"] }],
      });

      res.send(selectedFile);
    },
  },
  {
    method: "get",
    path: "/file/*",
    handler: async (req, res) => {
      //   let referer = req.headers.referer || req.headers.referrer;
      //   let ar = referer.split("/");

      const extName = path.extname(req.params[0]);

      // Tipos de contenido
      const contentTypes = {
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".ico": "image/x-icon",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".mp3": "audio/mpeg", // Tipo de contenido para archivos mp3
        ".mp4": "video/mp4", // Tipo de contenido para archivos mp4
      };

      const contentType = contentTypes[extName] || "text/html";

      res.writeHead(200, { "Content-Type": contentType });

      // open
      let pk = await lw.json("read", null, __dirname, "package.json");
      const nameFolder = path.dirname(__dirname);
      const nameFile = path.join(nameFolder, pk.name, req.params[0]);

      const readStream = fs.createReadStream(nameFile);

      readStream.pipe(res);
    },
  },
  {
    method: 'get',
    path: '/stop-all-process',
    handler: (req, res) => {
      if (req.query.active) {
        torrentdownload.destroyAll();
        cache = {};
      }
      res.end();
    }
  }
];

module.exports = [...routes, ...lib];
