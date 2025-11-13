export type SyllabusTopic = {
  name: string;
  children?: SyllabusTopic[];
};

export type SyllabusPaper = {
  title: string;
  subjects: SyllabusTopic[];
};