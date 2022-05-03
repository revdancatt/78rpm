/* global preloadImagesTmr fxhash fxrand paper1Loaded Path2D */

//
//  fxhash - 78rpm
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

const ratio = 1
// const startTime = new Date().getTime() // so we can figure out how long since the scene started
let drawn = false
let highRes = false // display high or low res
const features = {}
const nextFrame = null

window.$fxhashFeatures = {}

//  Work out what all our features are
const makeFeatures = () => {
  // features.background = 1
  features.paperOffset = {
    paper1: {
      x: fxrand(),
      y: fxrand()
    },
    paper2: {
      x: fxrand(),
      y: fxrand()
    }
  }
  features.inchToCm = 2.54
  features.speed = 78 // rpm
  features.size = 10 * features.inchToCm // cm
  features.hole = 7.14375 / 10 // cm
  features.duration = 3 / 10 // minutes
  features.rotations = features.speed * features.duration // errr, rotations
  features.labelSize = 10 // cm

  const labelColours = [{
    h: 353,
    s: 98,
    l: 74
  }, {
    h: 39,
    s: 100,
    l: 74
  }, {
    h: 241,
    s: 77,
    l: 87
  }, {
    h: 142,
    s: 100,
    l: 71
  }]
  const altLabelColours = [{
    h: 299,
    s: 99,
    l: 73
  }, {
    h: 46,
    s: 41,
    l: 50
  }, {
    h: 201,
    s: 21,
    l: 77
  }]
  //  Pick the label colour
  features.label1Choice = Math.floor(fxrand() * labelColours.length)
  features.label1Colour = labelColours[features.label1Choice]
  if (fxrand() < 0.18) {
    features.label1Choice = Math.floor(fxrand() * altLabelColours.length)
    features.label1Colour = altLabelColours[features.label1Choice]
  }
  //  And the second label colour
  features.label2Choice = Math.floor(fxrand() * labelColours.length)
  features.label2Colour = labelColours[features.label2Choice]
  if (fxrand() < 0.18) {
    features.label2Choice = Math.floor(fxrand() * altLabelColours.length)
    features.label2Colour = altLabelColours[features.label2Choice]
  }
  features.labelAngle = Math.floor(fxrand() * 360)
  features.labelOffsetX = (fxrand() * 2) - 1
  features.labelOffsetY = (fxrand() * 2) - 1

  //  Now we want to work out how many tracks there are
  const trackCount = 1

  //  Now that we know how many tracks we have, we need to work out the lengths of them
  features.tracks = []
  features.leadIn = 1 // seconds
  features.leadOut = 2 // seconds
  features.gap = 2 // seconds
  features.fade = 2 // seconds
  features.runTime = features.duration * 60 // seconds
  features.playTime = features.runTime - features.leadIn - features.leadOut - ((trackCount - 1) * features.gap)
  features.averageTrackLength = features.playTime / trackCount
  let startTime = features.leadIn
  let remainingTime = features.playTime
  for (let t = 0; t < trackCount - 1; t++) {
    const track = {
      index: t + 1
    }
    track.start = startTime
    track.trackLength = Math.floor(((fxrand() / 10 * 4) + 0.8) * features.averageTrackLength)
    track.end = track.start + track.trackLength
    track.bpm = Math.floor(fxrand() * 30) + 100
    features.tracks.push(track)
    remainingTime -= track.trackLength
    startTime += track.trackLength + features.gap
  }
  //  Now put on the last track
  features.tracks.push({
    index: trackCount,
    start: startTime,
    trackLength: remainingTime,
    end: startTime + remainingTime,
    bpm: Math.floor(fxrand() * 30) + 100
  })
  const startAnglesStep = 360 / 90
  const endAnglesStep = 360 / 360
  const maxTotalAngles = 360 * features.rotations
  let remainingAngles = maxTotalAngles
  features.track = []
  let currentAngle = 0

  while (remainingAngles > 0) {
    //  How far along are we
    const percent = remainingAngles / maxTotalAngles
    //  create the point
    const point = {
      radius: percent,
      angle: currentAngle,
      timeStamp: features.runTime * (1 - percent),
      bump: 1
    }
    //  Work out how far through all the tracks we are
    //  const currentSeconds = features.runTime * percent
    //  1. Now figure out if we are in a track or not
    const currentSecond = features.runTime * (1 - percent)
    for (const track of features.tracks) {
      if (point.timeStamp >= track.start && currentSecond <= track.end) {
        point.bump = 2
        //  If we are at the start
        const fadeEnd = track.start + features.fade
        const fadeStart = track.end - features.fade
        //  Work out the fade into the start of the track
        if (point.timeStamp <= fadeEnd) {
          const startFadePercent = 1 - ((fadeEnd - point.timeStamp) / features.fade)
          point.bump = 1 + startFadePercent
        }
        //  Work out the fade at the end
        if (point.timeStamp >= fadeStart) {
          const endFadePercent = 1 - ((point.timeStamp - fadeStart) / features.fade)
          point.bump = 1 + endFadePercent
        }

        //  Work out how far we are into the track
        const timeInTrack = point.timeStamp - track.start
        point.bump = ((point.bump - 1) * Math.abs(Math.sin((timeInTrack / ((track.bpm / 60) / 2 / 10))) * 4)) + 1
      }
    }
    //  2. If we're in the track, figure out the bpm
    //  3. Additional noise wobble
    //  4. Take the fade into effect

    //  Work out how much we need to turn next time, somewhere between the outer angle
    //  and the inner angle
    const angle = startAnglesStep + ((endAnglesStep - startAnglesStep) * percent)
    //  Knock it off from the remaining angles, until we've been through everything
    currentAngle += angle
    while (currentAngle >= 360) currentAngle -= 360
    remainingAngles -= angle
    //  Put the point into the track
    features.track.push(point)
  }
  console.log(features)
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()
console.table(window.$fxhashFeatures)

const init = async () => {
  //  I should add a timer to this, but really how often to people who aren't
  //  the developer resize stuff all the time. Stick it in a digital frame and
  //  have done with it!
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    await layoutCanvas()
    //  And redraw it
    drawCanvas()
  })

  //  Now layout the canvas
  await layoutCanvas()
  //  And draw it!!
  drawCanvas()
}

const layoutCanvas = async () => {
  //  Kill the next animation frame
  window.cancelAnimationFrame(nextFrame)

  const wWidth = window.innerWidth
  const wHeight = window.innerHeight
  let cWidth = wWidth
  let cHeight = cWidth * ratio
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }
  const canvas = document.getElementById('target')
  if (highRes) {
    canvas.height = 8192
    canvas.width = 8192 / ratio
  } else {
    canvas.width = Math.min((8192 / 2), cWidth * 2)
    canvas.height = Math.min((8192 / ratio / 2), cHeight * 2)
    //  Minimum size to be half of the high rez cersion
    if (Math.min(canvas.width, canvas.height) < 8192 / 2) {
      if (canvas.width < canvas.height) {
        canvas.height = 8192 / 2
        canvas.width = 8192 / 2 / ratio
      } else {
        canvas.width = 8192 / 2
        canvas.height = 8192 / 2 / ratio
      }
    }
  }

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  //  Re-Create the paper pattern
  const paper1 = document.createElement('canvas')
  paper1.width = canvas.width / 2
  paper1.height = canvas.height / 2
  const paper1Ctx = paper1.getContext('2d')
  await paper1Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper1.width, paper1.height)
  features.paper1Pattern = paper1Ctx.createPattern(paper1, 'repeat')

  const paper2 = document.createElement('canvas')
  paper2.width = canvas.width / (22 / 7)
  paper2.height = canvas.height / (22 / 7)
  const paper2Ctx = paper2.getContext('2d')
  await paper2Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper2.width, paper2.height)
  features.paper2Pattern = paper2Ctx.createPattern(paper2, 'repeat')

  drawCanvas()
}

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawn = true
  //  Make sure there's only one nextFrame to be called
  window.cancelAnimationFrame(nextFrame)

  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  //  Lay down the first paper texture
  ctx.fillStyle = features.paper1Pattern
  ctx.save()
  ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
  ctx.fillRect(0, 0, w * 2, h * 2)
  ctx.restore()

  //  Lay down the second paper texture
  ctx.globalCompositeOperation = 'darken'
  ctx.fillStyle = features.paper2Pattern
  ctx.save()
  ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
  ctx.fillRect(0, 0, w * 2, h * 2)
  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'

  //  If we want to modify the colour, i.e. for riso pink, do that here
  if (features.background) {
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `hsla(${features.background}, 100%, 50%, 1)`
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  //  do all the sizes
  const scaleMod = 0.95

  const outerRadius = ((features.size / (12 * features.inchToCm)) / 2) * scaleMod
  ctx.lineWidth = w / 1000
  ctx.strokeStyle = 'black'
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, outerRadius * w, 0, 2 * Math.PI)
  ctx.stroke()

  const labelRadius = ((features.labelSize / (12 * features.inchToCm)) / 2) * scaleMod
  ctx.lineWidth = w / 1000
  ctx.strokeStyle = 'black'
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, labelRadius * w, 0, 2 * Math.PI)
  ctx.stroke()

  //  Get the first point
  const trackArea = (outerRadius - labelRadius)
  const border = trackArea * 0.05
  const trackOuterRadius = outerRadius - (border / 2)
  const trackInnerRadius = labelRadius + (border / 2)
  const trackDiffRadius = trackOuterRadius - trackInnerRadius
  const lineWidth = trackDiffRadius / features.rotations * w / 4

  const pi = Math.PI

  for (let p = 1; p < features.track.length; p++) {
    ctx.beginPath()
    const point0 = features.track[p - 1]
    const radius0 = (trackInnerRadius * w) + (trackDiffRadius * point0.radius * w)
    const x0 = Math.sin(point0.angle * pi / 180) * radius0
    const y0 = Math.cos(point0.angle * pi / 180) * radius0
    ctx.moveTo(x0 + (w / 2), y0 + (h / 2))

    const point = features.track[p]
    const radius = (trackInnerRadius * w) + (trackDiffRadius * point.radius * w)
    const x = Math.sin(point.angle * pi / 180) * radius
    const y = Math.cos(point.angle * pi / 180) * radius
    ctx.lineWidth = lineWidth * point.bump * 0.8
    ctx.lineTo(x + (w / 2), y + (h / 2))
    ctx.stroke()
  }

  //  Now do the label
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(features.labelAngle * Math.PI / 180)
  ctx.globalCompositeOperation = 'multiply'
  //  Do the first half of the label
  ctx.save()
  const label1 = new Path2D()
  label1.arc(0, 0, labelRadius * 0.9 * w, 0, 2 * Math.PI)
  ctx.clip(label1)

  ctx.rect(-w, -h, w * 2, h * 2)
  ctx.fillStyle = `hsla(${features.label1Colour.h}, ${features.label1Colour.s}%, ${features.label1Colour.l}%, 1)`
  ctx.fill()
  ctx.restore()

  //  Do the second half of the label
  ctx.save()
  const label2 = new Path2D()
  label2.arc((w / 400) * features.labelOffsetX, -(h / 200) * features.labelOffsetY, labelRadius * 0.9 * w, 0, 1 * Math.PI)
  ctx.clip(label2)

  ctx.rect(-w, -h, w * 2, h * 2)
  ctx.fillStyle = `hsla(${features.label2Colour.h}, ${features.label2Colour.s}%, ${features.label2Colour.l}%, 1)`
  ctx.fill()
  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  //  Draw the hole
  const holeRadius = ((features.hole / (12 * features.inchToCm)) / 2) * scaleMod
  ctx.lineWidth = w / 1000
  ctx.strokeStyle = 'black'
  ctx.fillStyle = features.paper1Pattern
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, holeRadius * w, 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()

  //  Now do it all over again
  // nextFrame = window.requestAnimationFrame(drawCanvas)
}

const autoDownloadCanvas = async (showHash = false) => {
  const element = document.createElement('a')
  element.setAttribute('download', `78rpm_${fxhash}`)
  element.style.display = 'none'
  document.body.appendChild(element)
  let imageBlob = null
  imageBlob = await new Promise(resolve => document.getElementById('target').toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob, {
    type: 'image/png'
  }))
  element.click()
  document.body.removeChild(element)
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    await layoutCanvas()
  }
})
//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  If paper1 has loaded and we haven't draw anything yet, then kick it all off
  if (paper1Loaded !== null && !drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
