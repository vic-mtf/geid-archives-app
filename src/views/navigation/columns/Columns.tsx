import {
  List,
  Stack,
} from "@mui/material";
// import { useDispatch, useSelector } from "react-redux";
// import { changeVisibilityColumn } from "../../../redux/data";

export default function Columns() {
  // const columns = useSelector(store => store?.data?.columns);
  // const dispatch = useDispatch();

  return (
    <Stack
      flex={1}
      display='flex'
      overflow='hidden'
      flexDirection='column'
      mb={1}>
      <List
        sx={{
          overflow: "auto",
          display: "flex",
          // flex: 1,
          width: "100%",
          flexDirection: "column",
        }}
        disablePadding
        dense>
        {/* <ListSubheader component="li" sx={{position: 'sticky'}}>
                Colonnes
            </ListSubheader> */}
        {/* {
                columns.map(col => (col?.headerName || col?.label)?.trim() && (
                    <ListItem key={col.field}>
                        <ListItemText primary={col?.headerName || col?.label} />
                        <Switch
                            edge="end"
                            size="small"
                            checked={!col?.hide}
                            onChange={(event, value) => {
                                const {field} = col
                                const hide = !value;
                                // dispatch(changeVisibilityColumn({field, hide}));
                            }}
                        />
                    </ListItem>
                ))
            } */}
      </List>
    </Stack>
  );
}
