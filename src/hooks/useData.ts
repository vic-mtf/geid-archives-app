import { useState, useEffect, useMemo } from "react";
import { faker } from "@faker-js/faker";

interface MockDataItem {
  id: string;
  createdAt: string;
  designation: string;
  destination: string;
  numeroDeClassement: string;
  numeroDeReference: string;
  status: string;
  numeroEntreeServiceDisposition: string;
  code: string;
  type: string;
  sousType: string;
  folder: boolean;
}

const useData = (num = 7): MockDataItem[] => {
  const [data, setData] = useState<MockDataItem[]>([]);

  useEffect(() => {
    const newData: MockDataItem[] = Array.from({ length: num }, () => ({
      id: faker.database.mongodbObjectId(),
      createdAt: faker.date.past().toLocaleDateString(),
      designation: faker.commerce.productName(),
      destination: faker.company.name(),
      numeroDeClassement: faker.string.alphanumeric(5).toLocaleLowerCase(),
      numeroDeReference: faker.string.alphanumeric(5).toLocaleLowerCase(),
      status: faker.helpers.arrayElement(["Active", "Inactive"]),
      numeroEntreeServiceDisposition: faker.string.numeric(),
      code: faker.string.numeric(5),
      type: faker.commerce.productName(),
      sousType: faker.commerce.productName(),
      folder: faker.datatype.boolean(),
    }));
    setData(newData);
  }, [num]);

  const sortData = useMemo(() => {
    const folders: MockDataItem[] = [];
    const files: MockDataItem[] = [];
    data.forEach((item) => {
      if (item.folder) folders.push(item);
      else files.push(item);
    });
    return [...folders, ...files];
  }, [data]);

  return sortData;
};

export default useData;
