export const GET_BOOKS = `
  query GetBooks {
    books {
      id
      title
      isbn
      publishedYear
      genre
      createdAt
      updatedAt
      author {
        id
        name
      }
    }
  }
`;

export const GET_AUTHORS = `
  query GetAuthors {
    authors {
      id
      name
      bio
      createdAt
      updatedAt
      bookCount
    }
  }
`;
