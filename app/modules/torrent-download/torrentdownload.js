const path = require("path");
const fs = require("fs");

const WebTorrent = require('webtorrent');
const parseTorrent = require('parse-torrent');

const UtilNode = require("../../../../modules/utilnode");
const utilnode = new UtilNode({
    parseTorrent: parseTorrent,
});

class TorrentDownload {
    constructor() {
        this.clients = {};
        this.hashs = [];
        this.downloads = {};
    }

    newClient(clientId) {
        const client = this.clients[clientId];
        if (client) {
            return client;
        } else {
            this.clients[clientId] = new WebTorrent();
            return this.clients[clientId];
        }
    }

    destroyClient(clientId) {
        const client = this.clients[clientId];
        if (client) {
            client.destroy(() => {
                delete this.clients[clientId];
            });
        }
    }

    deleteHashs(valor) {
        const indice = this.hashs.indexOf(valor);
        if (indice !== -1) {
            this.hashs.splice(indice, 1);
        } else {
            return null;
        }
    }

    endDownload(hash) {
        this.destroyClient(hash);
        // this.deleteHashs(hash);
        // delete this.downloads[hash];
    }

    destroyAll(){
        const clientAll = Object.keys(this.clients); 
        for (const client of clientAll) {
            this.destroyClient(client);
        }
        this.hashs = [];
        this.downloads = {};
    }

    async download(saveIn, { hash, magnet, peso, timeoutMilliseconds }) {
        const veryHash = this.hashs.includes(hash);
        let getDataTorrent = await utilnode.getInfoTorrent(magnet);

        if (veryHash) {
            return new Promise((resolve, reject) => {
                const setError = new Error('This torrent is already in the download list');
                setError.title = 'Error, cannot add';
                reject(setError);
            });
        } else {
            const client = this.newClient(hash);

            this.hashs.unshift(hash);

            return new Promise((resolve, reject) => {
                let timeoutId = setTimeout(() => {
                    this.destroyClient(hash);
                    this.deleteHashs(hash);
                    delete this.downloads[hash];

                    const setError = new Error("Can't download the torrent because the waiting time has expired");
                    setError.title = 'Timeout expired';
                    reject(setError);

                }, timeoutMilliseconds);

                client.add(magnet, {
                    path: saveIn,
                    timeout: timeoutMilliseconds
                }, (torrent) => {
                    clearTimeout(timeoutId);

                    this.updateTorrentData(hash, {
                        infoHash: getDataTorrent.infoHash,
                        name: getDataTorrent.name,
                        length: parseInt(peso),
                        peso: parseInt(peso),
                        downloadSpeed: 0,
                        uploadSpeed: 0,
                        downloaded: 0,
                        progress: 0,
                        numPeersToWire: 0,
                        timeRemaining: 0,
                        paused: false,
                        magnet: getDataTorrent.magnet,
                        timeoutMilliseconds,
                        saveIn
                    });


                    torrent.on('download', () => {
                        this.updateTorrentData(hash, torrent);
                    });

                    torrent.on('done', async () => {
                        this.updateTorrentData(hash, {
                            length: torrent.length,
                            downloadSpeed: 0,
                            uploadSpeed: 0,
                            downloaded: torrent.length,
                            progress: 100,
                            numPeersToWire: 0,
                            timeRemaining: 0,
                            done: true,
                        });

                        this.endDownload(torrent.infoHash);
                    });


                    resolve({
                        name: torrent.name,
                        infoHash: torrent.infoHash,
                    })
                })

            })
        }

    }

    pause(hash) {
        if (this.clients[hash]) {
            this.destroyClient(hash);
            if (this.downloads[hash]) {
                this.downloads[hash].paused = true;
                this.downloads[hash].downloadSpeed = 0;
                this.downloads[hash].uploadSpeed = 0;
                this.downloads[hash].numPeersToWire = 0;
                this.downloads[hash].timeRemaining = 0;
            }
        }
    }

    async continue(hash) {
        if (this.downloads[hash]) {
            this.downloads[hash].paused = false;
            try {
                await this.download(this.downloads[hash].saveIn, { hash, magnet: this.downloads[hash].magnet, peso: this.downloads[hash].peso, timeoutMilliseconds: this.downloads[hash].timeoutMilliseconds });
                return true;
            } catch (error) {
                return error;
            }
        }
    }

    stop(hash) {
        if (this.clients[hash]) {
            this.destroyClient(hash);
            this.deleteHashs(hash);
            delete this.downloads[hash];
        } else {
            this.deleteHashs(hash);
            delete this.downloads[hash];
        }
    }

    // this.downloads
    updateTorrentData(hash, torrent) {
        if (this.downloads[hash]) {
            this.downloads[hash].length = torrent.length || 0;
            this.downloads[hash].downloadSpeed = torrent.downloadSpeed || 0;
            this.downloads[hash].uploadSpeed = torrent.uploadSpeed || 0;
            this.downloads[hash].downloaded = torrent.downloaded || 0;
            this.downloads[hash].progress = (torrent.downloaded / torrent.length) * 100 || 0;
            this.downloads[hash].numPeersToWire = torrent.numPeersToWire || 0;
            this.downloads[hash].timeRemaining = torrent.timeRemaining || 0;
            this.downloads[hash].done = torrent.done;
        } else {
            this.downloads[hash] = torrent;
        }
    }

    progressTorrent(torrent) {
        return (torrent.downloaded / torrent.length * 100).toFixed(2);
    }
}
module.exports = TorrentDownload;