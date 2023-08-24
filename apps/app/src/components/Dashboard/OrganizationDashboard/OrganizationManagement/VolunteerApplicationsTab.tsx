import { SearchIcon } from '@heroicons/react/outline'
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'

import { GridItemSix, GridLayout } from '@/components/GridLayout'
import { ClearFilters } from '@/components/Shared'
import { Card, ErrorMessage, Spinner } from '@/components/UI'
import { checkAuth, useCreateComment } from '@/lib/lens-protocol'
import useApplications from '@/lib/lens-protocol/useApplications'
import { buildMetadata, PostTags } from '@/lib/metadata'
import { useAppPersistStore } from '@/store/app'

import { DashboardDropDown } from '../../VolunteerDashboard'
import PurpleBox from './PurpleBox'
import VolunteerApplicationCard from './VolunteerApplicationCard'

/**
 * Reference to the {@link VolunteerApplicationsTab} component;
 */
export interface ApplicationsRef {
  /**
   * Function to refetch applications
   * @returns
   */
  refetch: () => void
}

/**
 * Properties of {@link VolunteerApplicationsTab}
 */
export interface IVolunteerApplicationsTabProps {
  /**
   * Whether the component should be shown
   */
  hidden: boolean
}

/**
 * Component that displays page for volunteer applications tab in {@link VolunteerManagementTab}.
 *
 * Applications are fetched using the {@link useApplications} hook, and application decisions are
 * made by making a comment on the application with the {@link useCreateComment} hook, and the
 * metadata tags {@link PostTags.Application.Accept} or {@link PostTags.Application.REJECT}.
 */
const VolunteerApplicationsTab = forwardRef<
  ApplicationsRef | null,
  IVolunteerApplicationsTabProps
>(({ hidden }, ref) => {
  const { currentUser: profile } = useAppPersistStore()
  const { createComment } = useCreateComment()

  const { loading, data, error, refetch } = useApplications({ profile })

  useImperativeHandle(ref, () => ({
    refetch
  }))

  const [selectedId, setSelectedId] = useState<string>('')

  const selectedValue = useMemo(() => {
    return data.find((val) => val.post_id === selectedId) ?? null
  }, [data, selectedId])

  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({})
  const [verifyOrRejectError, setVerifyOrRejectError] = useState('')

  const [searchValue, setSearchValue] = useState('')
  const [categories] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const setIdPending = (id: string) => {
    const newPendingIds = { ...pendingIds, [id]: true }
    setPendingIds(newPendingIds)
  }

  const removeIdPending = (id: string) => {
    setPendingIds({ ...pendingIds, [id]: false })
  }

  const onAcceptClick = async () => {
    if (profile === null) return

    setIdPending(selectedId)

    try {
      await checkAuth(profile.ownedBy)

      const metadata = buildMetadata(profile, [PostTags.Application.Accept], {})

      await createComment({
        publicationId: selectedId,
        metadata,
        profileId: profile.id
      })
    } catch (e: any) {
      setVerifyOrRejectError(e.message ?? e)
    }

    removeIdPending(selectedId)
  }

  const onRejectClick = async () => {
    if (profile === null) return

    setIdPending(selectedId)

    try {
      await checkAuth(profile.ownedBy)

      const metadata = buildMetadata(profile, [PostTags.Application.REJECT], {})

      await createComment({
        publicationId: selectedId,
        metadata,
        profileId: profile.id
      })
    } catch (e: any) {
      setVerifyOrRejectError(e.message ?? e)
    }

    removeIdPending(selectedId)
  }

  return (
    <div className={`${hidden ? 'hidden' : ''} pt-5`}>
      <h1 className="text-3xl font-bold pb-3">Volunteer Applications</h1>
      <div className="flex flex-wrap items-center">
        <div className="flex justify-between h-[50px] bg-accent-content items-center rounded-md border-violet-300 border-2 dark:bg-Input">
          <input
            className="focus:ring-0 border-none outline-none focus:border-none focus:outline-none bg-transparent rounded-2xl"
            type="text"
            value={searchValue}
            placeholder={'search'}
            onChange={(e) => {
              setSearchValue(e.target.value)
            }}
          />
          <div className="h-5 w-5 mr-5">
            <SearchIcon />
          </div>
        </div>

        <div className="flex flex-wrap items-center py-2">
          <div className="h-[50px] z-10 ">
            <DashboardDropDown
              label={'filter'}
              options={Array.from(categories)}
              onClick={(c) => setSelectedCategory(c)}
              selected={selectedCategory}
            ></DashboardDropDown>
          </div>
          <div className="py-2">
            <ClearFilters
              onClick={() => {
                setSelectedCategory('')
              }}
            />
          </div>
        </div>
      </div>
      <GridLayout>
        <GridItemSix>
          <Card className="mb-2">
            {(verifyOrRejectError || error) && (
              <ErrorMessage error={new Error(verifyOrRejectError || error)} />
            )}
            <div className="scrollbar">
              {loading ? (
                <Spinner />
              ) : (
                <>
                  {data.map((item) => {
                    return (
                      <PurpleBox
                        key={item.post_id}
                        selected={selectedId === item.post_id}
                        userName={item.from.name ?? item.from.handle}
                        dateCreated={item.createdAt}
                        tab="applications"
                        onClick={() => {
                          setSelectedId(
                            selectedId === item.post_id ? '' : item.post_id
                          )
                        }}
                      />
                    )
                  })}
                </>
              )}

              {/* the box placeholder for the data ^ */}
            </div>
          </Card>
        </GridItemSix>
        <GridItemSix>
          {selectedId !== '' && !!selectedValue && (
            <div className="pb-10">
              <VolunteerApplicationCard
                application={selectedValue}
                onAccept={() => onAcceptClick()}
                onReject={() => onRejectClick()}
                pending={pendingIds[selectedId]}
              />
            </div>
          )}
        </GridItemSix>
      </GridLayout>
    </div>
  )
})

VolunteerApplicationsTab.displayName = 'VolunteerApplicationsTab'

export default VolunteerApplicationsTab
