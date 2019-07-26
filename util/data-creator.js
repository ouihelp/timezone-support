const { outputFile: writeFile } = require('fs-extra')
const tz = require('../node_modules/moment-timezone/moment-timezone-utils').tz
const groupLeaders = require('./data/group-leaders.json')
const unpackedTimeZoneData = require('./data/unpacked.json')

function limitData (firstYear, lastYear, timeZones) {
  let localUnpackedTimeZoneData = unpackedTimeZoneData
  if (timeZones) {
    localUnpackedTimeZoneData = {
      version: unpackedTimeZoneData.version,
      links: unpackedTimeZoneData.links,
      zones: unpackedTimeZoneData.zones.filter(z => timeZones.split(',').includes(z.name)),
    }
  }
  return tz.filterLinkPack(localUnpackedTimeZoneData, firstYear || 1900, lastYear || 2050, localGroupLeaders)
}

function formatES6Module (content) {
  return `export default ${content}`
}

function formatCJSModule (content) {
  return `module.exports = ${content}`
}

function formatAMDModule (content) {
  return `define(function () {
  return ${content}
})`
}

function formatUMDModule (content, umdName) {
  return `(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory(global.${umdName || 'timezoneData'} = {})
} (this, (function (exports) {
  Object.assign(exports, ${content})
  Object.defineProperty(exports, '__esModule', { value: true })
})))`
}

function createTimeZoneData (options = {}) {
  const {
    asModule, asCjsModule, asAmdModule, asUmdModule, umdName,
    firstYear, lastYear, outputFile, timeZones
  } = options
  const data = limitData(firstYear, lastYear, timeZones)
  let content = JSON.stringify(data, undefined, 2)
  if (asModule) {
    content = formatES6Module(content)
  } else if (asCjsModule) {
    content = formatCJSModule(content)
  } else if (asAmdModule) {
    content = formatAMDModule(content)
  } else if (asUmdModule) {
    content = formatUMDModule(content, umdName)
  }
  if (outputFile) {
    if (firstYear && lastYear) {
      console.log(`Writing time zone data for ${firstYear}-${lastYear} to "${outputFile}"...`)
    } else {
      console.log(`Writing all time zone data to "${outputFile}"...`)
    }
    return writeFile(outputFile, content)
  }
  return Promise.resolve(content)
}

exports.createTimeZoneData = createTimeZoneData
