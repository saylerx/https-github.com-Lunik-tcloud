/**
 * Created by lunik on 12/07/2017.
 */

import Peer from './peer'
import Config from './config'
import Folder from '../model/folder'
import fs from 'fs-extra'
import mv from 'mv'
import Delogger from 'delogger'

const config = new Config({sync: true})

export default class Torrent {
  constructor (props) {
    props = props || {}
    this.baseFolder = props.baseFolder || new Folder(`/${__dirname}/${config.files.path}`, '')
    this.peers = {}
    this.log = new Delogger('Torrent')
  }

  download (magnet) {
    var peer = new Peer({
      magnet: magnet
    })

    this.peers[peer.uid] = peer

    this.peers[peer.uid].on('done', (peer) => this.handlePeerDone(peer))
    this.peers[peer.uid].on('stop', (peer) => this.handlePeerStop(peer))
    return this.peers[peer.uid]
  }

  handlePeerStop (peer) {
    if (peer.metadata.path) {
      fs.removeSync(peer.metadata.path)
    }
    delete this.peers[peer.uid]
  }

  handlePeerDone (peer) {
    var oldPath = peer.metadata.fullPath
    var newPath = `${__dirname}/${config.files.path}/${peer.metadata.name}`

    var childs = fs.readdirSync(`${__dirname}/${config.files.path}`)

    if (childs.indexOf(peer.metadata.name) === -1) {
      mv(oldPath, newPath, {}, (err) => {
        if (err) this.log.error(err)
      })
    } else {
      fs.removeSync(oldPath)
    }
    delete this.peers[peer.uid]
  }
}
