# Data Model

## MongoDB Database: `dyatra_ops`

### Table → Collection Mapping
| activeTable value     | MongoDB collection |
|-----------------------|--------------------|
| `Events`              | `events`           |
| `Session`             | `sessions`         |
| `MusicLog`            | `musiclog`         |
| `VideoLog`            | `videolog`         |
| `Tracks`              | `media`            |
| `DyatraChecklist`     | `checklist`        |
| `Guidance & Learning` | `guidance`         |
| `LED`                 | `led_details`      |
| `DataSharing`         | `locations`        |
| `VideoSetup`          | `videosetup`       |
| `AudioSetup`          | `audiosetup`       |

Column settings (extra/custom columns) are stored in `app_settings` collection
with `{ type: 'columns', data: { [tableName]: string[] } }`.

### Record IDs
- All records use MongoDB `_id` (ObjectId) as primary key
- Code always checks `record._id || record.id` for backward compat
- When sending PUT requests, delete `_id` from the body (server uses it in the URL)

### Key Field Relationships
- `Sessions["Parent Event"]` links to `Events["Event Name"]`
- `Events["Sessions"]` (comma-separated string) lists session names linked to that event
  - Legacy records may store this as `Events["Imported table"]` — always check both:
    `item["Sessions"] || item["Imported table"]`
- `MusicLog["Session"]` and `VideoLog["Session"]` link to `Sessions["Session Name"]`
- Auto-filled fields (e.g. `"Date (from Session)"`) are derived when a session is selected

### Date Fields
- Stored in MongoDB as ISO strings (`"2024-01-15T00:00:00.000Z"`)
- Must normalize to `YYYY-MM-DD` before setting into `<input type="date">`
- Normalization logic: split on `'T'`, or `new Date(raw).toISOString().split('T')[0]`
- Fields requiring normalization: `DateFrom`, `DateTo`, `Date`

### Events Columns
`['Event Name', 'DateFrom', 'DateTo', 'Occasion', 'City', 'Venue', 'Sessions', 'Year']`

### Session Columns
`['Session Name', 'Parent Event', 'Date', 'City', 'Venue', 'Time Of Day', 'Occasion', 'SessionType', 'Notes']`
