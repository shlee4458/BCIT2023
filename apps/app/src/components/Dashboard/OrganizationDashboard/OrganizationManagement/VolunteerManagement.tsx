import { PlusCircleIcon } from '@heroicons/react/outline'
import React, { useState } from 'react'

import { GridItemTwelve, GridLayout } from '@/components/GridLayout'

import AllVolunteersTab from './AllVolunteersTab'
import VolunteerApplicationsTab from './VolunteerApplicationsTab'

export const getFormattedDate = (date: string): string => {
  const fillZero = (n: number, w: number) => {
    let str = String(n)
    for (let i = str.length; i < w; i++) {
      str = '0' + str
    }
    return str
  }

  const _date = new Date(date)
  const day = fillZero(_date.getDay(), 2)
  const month = fillZero(_date.getMonth(), 2)
  const year = fillZero(_date.getFullYear(), 2)

  return `${year}-${month}-${day}`
}

/**
 * Component that displays a page to manage volunteer applications. Open applications
 * and application requests are fetched using the {@link useApplications} hook.
 *
 * Applications are accepted/rejected by adding a comment under the application post
 * using the {@link useCreateComment} hook and the {@link PostTags.Application.Accept}
 * or {@link PostTags.Application.REJECT} metadata tag.
 */
const VolunteerManagementTab: React.FC = () => {
  const [openTab, setOpenTab] = useState(0)

  const tabs = [
    {
      title: 'All Volunteers'
    },
    {
      title: 'Volunteer Applications'
    }
  ]

  return (
    <GridLayout>
      <GridItemTwelve>
        <div className="flex flex-wrap items-center mt-10 px-10">
          <div className="flex flex-wrap">
            {tabs.map((t, i) => (
              <p
                key={i}
                className={`px-3 cursor-pointer border border-zinc-400 grow ${
                  openTab === i
                    ? 'bg-zinc-300 dark:bg-brand-600'
                    : 'bg-white dark:bg-brand-400'
                }`}
                onClick={() => setOpenTab(i)}
              >
                {t.title}
              </p>
            ))}
          </div>

          <div className="flex items-center shrink-0 justify-end ml-auto pt-2">
            <p>Add a Volunteer</p>
            <PlusCircleIcon className="ml-2 w-8 text-brand-400" />
          </div>
        </div>
        <div className="ml-5">
          <AllVolunteersTab hidden={openTab !== 0} />
          <VolunteerApplicationsTab hidden={openTab !== 1} />
        </div>
      </GridItemTwelve>
    </GridLayout>
  )
}

export default VolunteerManagementTab
