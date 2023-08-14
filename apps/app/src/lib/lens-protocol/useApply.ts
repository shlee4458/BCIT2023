import {
  MetadataAttributeInput,
  ProfileFragment,
  PublicationMainFocus,
  PublicationMetadataDisplayTypes,
  PublicationMetadataV2Input
} from '@lens-protocol/client'
import { useStorageUpload } from '@thirdweb-dev/react'
import { useSDK } from '@thirdweb-dev/react'
import { signTypedData } from '@wagmi/core'
import { useState } from 'react'
import { v4 } from 'uuid'

import { APP_NAME } from '@/constants'
import { LogVhrRequestMetadataRecord, PostTags } from '@/lib/metadata'

import getUserLocale from '../getUserLocale'
import { MetadataVersion } from '../types'
import checkAuth from './checkAuth'
import getSignature from './getSignature'
import lensClient from './lensClient'
interface Props {
  publicationId: string
  organizationId: string
}

import { useTranslation } from 'react-i18next'

const useApply = (params: Props) => {
  const { t: e } = useTranslation('common', {
    keyPrefix: 'errors'
  })

  const { mutateAsync: upload } = useStorageUpload()
  const sdk = useSDK()

  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>()

  const apply = async (
    profile: ProfileFragment | null,
    hoursToVerify: string,
    comments: string,
    close?: Function
  ) => {
    setIsLoading(true)
    try {
      if (profile === null) {
        throw Error(e('profile-null'))
      }

      if (!sdk) {
        throw Error(e('metadata-upload-fail'))
      }

      const data: LogVhrRequestMetadataRecord = {
        type: PostTags.VhrRequest.Opportunity,
        version: MetadataVersion.LogVhrRequestMetadataVersions['1.0.0'],
        hoursToVerify,
        comments
      }

      const attributes: MetadataAttributeInput[] = Object.entries(data).map(
        ([k, v]) => {
          return {
            traitType: k,
            value: v,
            displayType: PublicationMetadataDisplayTypes.String
          }
        }
      )

      const metadata: PublicationMetadataV2Input = {
        version: '2.0.0',
        metadata_id: v4(),
        content: `#${PostTags.VhrRequest.Opportunity} #${params.organizationId}`,
        locale: getUserLocale(),
        tags: [PostTags.VhrRequest.Opportunity, params.organizationId],
        mainContentFocus: PublicationMainFocus.TextOnly,
        name: `${PostTags.VhrRequest.Opportunity} by ${profile.handle} for publication ${params.publicationId}`,
        attributes,
        appId: APP_NAME
      }

      await checkAuth(profile.ownedBy)

      const contentURI = sdk?.storage.resolveScheme(
        (await upload({ data: [metadata] }))[0]
      )

      const typedDataResult =
        await lensClient().publication.createCommentTypedData({
          profileId: profile.id,
          publicationId: params.publicationId,
          contentURI,
          collectModule: {
            freeCollectModule: {
              followerOnly: false
            }
          },
          referenceModule: { followerOnlyReferenceModule: false }
        })

      const signature = await signTypedData(
        getSignature(typedDataResult.unwrap().typedData)
      )

      const broadcastResult = await lensClient().transaction.broadcast({
        id: typedDataResult.unwrap().id,
        signature: signature
      })

      if (close) close()

      return broadcastResult
    } catch (e) {
      if (e instanceof Error) {
        setError(e)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    error,
    setError,
    isLoading,
    apply
  }
}

export default useApply
