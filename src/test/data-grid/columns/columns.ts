export interface Column {
  field: string;
  label?: string;
  width?: number;
  type?: string;
  pin?: boolean;
  id?: string;
  description?: string;
  multiline?: boolean;
  [key: string]: unknown;
}

const columns: Column[] = [
  {
    field: "id",
    label: "N°",
    width: 50,
    type: "number",
    pin: true,
    id: "_id",
    //sortable: false,
  },
  {
    field: "createdAt",
    label: "Date de création",
    type: "date",
    width: 175,
    id: "_createdAt",
    description: ``,
    //pin: true,
  },
  {
    field: "designation",
    label: "Designation",
    width: 175,
    id: "_designation",
    description: ``,
  },
  {
    field: "origin",
    label: "Provenance",
    width: 175,
    id: "_origin",
    multiline: true,
    description: ``,
  },
  {
    field: "destination",
    label: "Destination",
    width: 175,
    id: "_destination",
  },
  {
    field: "secrete",
    label: "Confidentialite",
    width: 175,
    id: "_secrete",
  },
  {
    field: "urgence",
    label: "Urgence",
    width: 175,
    id: "_urgence",
  },
  {
    label: "Numero de classement",
    field: "classNum",
    width: 175,
    id: "_classNum",
  },
  {
    label: "Numero de référence",
    field: "refNum",
    width: 175,
    id: "_refNum",
  },
  {
    label: "Numero d'entree dans le service Disposition",
    field: "numServiceDis",
    width: 175,
    id: "_numServiceDis",
  },
  {
    field: "code",
    label: "Code",
    width: 175,
    id: "_code",
  },
  {
    field: "type",
    label: "Type",
    width: 175,
    id: "_type",
  },
  {
    field: "subType",
    label: "Sous type",
    width: 175,
    id: "_sub-type",
  },
  {
    field: "object",
    label: "Objet",
    width: 175,
    id: "_object",
  },
  {
    field: "description",
    label: "Description",
    width: 175,
    id: "_description",
  },
  {
    field: "status",
    label: "Statut",
    width: 175,
    id: "_status",
  },
];

export default columns;
