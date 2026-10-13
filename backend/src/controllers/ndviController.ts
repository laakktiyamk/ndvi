import { Request, Response, NextFunction } from 'express'
import type { SentinelRequest } from '../sentinelhub/sentinelhub_token'
import { syncAOI } from '../services/ndviService'
import * as mongodb from '../mongo/mongodb'
import { IImage } from '../types'

// ============================================================
// processAOI — REST API: vastaanottaa AOI:n ja päivämäärät, hakee NDVI-tilastot ja kuvat 
// ============================================================

export const processAOI = async (req: SentinelRequest, res: Response, next: NextFunction): Promise<void> => {
  const authToken = req.authToken ?? ''
  const startTime = performance.now()

  let geometry: any
  try {
    geometry = typeof req.body.geometry !== 'object'
      ? JSON.parse(req.body.geometry)
      : req.body.geometry
  } catch (e) {
    res.status(400).send('invalid geometry')
    return
  }

  try {
    const data = await syncAOI(
      geometry,
      new Date(req.body.start_date),
      authToken,
      req.body.name ?? '',      
      req.user!._id,  
      req.body.kasvulohkot ?? []
    )
    console.log('Request handled in (sec): ', (performance.now() - startTime) / 1000)

    if (data) res.status(200).send(data)
    else res.status(404).send('no data available')
  } catch (e: unknown) {
    if (e instanceof Error) console.error('processAOI error:', e.message)
    res.status(500).json({ error: 'Server error' })
  }
}

// ============================================================
// Image handlers 
// ============================================================

export const image = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.sentinelid
  const all = req.query.all as string | undefined

  if (all) {
    const rawData: IImage[] = await mongodb.getAllImages(id as string)
    try {
      const data = rawData.map((item) => ({
        ...item,
        image: {
          ...item.image,
          dataUrl: `data:image/png;base64,${Buffer.from(item.image.dataUrl.buffer).toString('base64')}`,
        },
      }))
      res.status(200).send(data)
      return
    } catch (e: unknown) {
      if (e instanceof Error) console.log(e.message)
    }
  }

  const _data = await mongodb.getImage(id as string)
  if (_data) {
    const dataUrl = `data:image/png;base64,${Buffer.from(_data.image.dataUrl.buffer).toString('base64')}`
    res.status(200).send({ ..._data, image: { ..._data.image, dataUrl } })
  }
}

export const images = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { ids } = req.body

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids array required' })
    return
  }

  try {
    const rawData: IImage[] = await mongodb.getImagesByIds(ids)

    const imageMap = rawData.reduce((acc, item) => {
      acc[item.id] = {
        ...item,
        image: {
          ...item.image,
          dataUrl: `data:image/png;base64,${Buffer.from(item.image.dataUrl.buffer).toString('base64')}`,
        },
      }
      return acc
    }, {} as Record<string, any>)

    res.status(200).json(imageMap)
  } catch (e: unknown) {
    if (e instanceof Error) console.error(e.message)
    res.status(500).json({ error: 'Server error' })
  }
}