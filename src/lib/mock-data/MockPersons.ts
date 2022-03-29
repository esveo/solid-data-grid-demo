import * as falso from "@ngneat/falso";
import { consumeAsync } from "../incremental-calc/consume";

export type Person = ReturnType<typeof generatePerson>;

function generatePerson(id: number) {
  return {
    id,
    name: falso.randFullName(),
    dateOfBirth: falso.randBetweenDate({
      from: new Date("1950-01-01"),
      to: new Date(),
    }),
    favoriteTeam: falso.randBasketballTeam(),
    country: falso.randCountry(),
  };
}

export async function loadMockPersons(n: number) {
  return consumeAsync(buildPersons(n));
}

function* buildPersons(n: number) {
  const array: Person[] = [];

  const chunkSize = 100;

  const chunkCount = Math.ceil(n / 100);

  for (
    let chunkIndex = 0;
    chunkIndex < chunkCount;
    chunkIndex++
  ) {
    const isLastChunk = chunkIndex === chunkCount - 1;
    const sizeOfThisChunk = isLastChunk
      ? Math.min(chunkSize, n % chunkSize || chunkSize)
      : chunkSize;

    for (let i = 0; i < sizeOfThisChunk; i++) {
      const realIndex = chunkIndex * chunkSize + i;
      array.push(generatePerson(realIndex));
    }

    yield;
  }

  return array;
}
